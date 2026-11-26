/**
 * HTTP transport with one shared, bounded cold-start probe.
 * Only GET /health is retried. Mutating requests are always sent at most once.
 */
export function createApiClient({
  baseUrl = "/api",
  fetchImpl = (...args) => globalThis.fetch(...args),
  readToken = () => "",
  now = () => Date.now(),
  warmupTimeoutMs = 90000,
  healthAttemptTimeoutMs = 15000,
  retryDelayMs = 2000,
  readyForMs = 12 * 60 * 1000,
} = {}) {
  const base = String(baseUrl).trim().replace(/\/+$/, "") || "/api";
  const listeners = new Set();
  let status = { phase: "idle", message: "" };
  let readyUntil = 0;
  let readyHealth = null;
  let warming = null;

  const publish = (phase, message = "") => {
    if (status.phase === phase && status.message === message) return;
    status = { phase, message };
    for (const listener of listeners) listener();
  };
  const makeError = (message, details = {}) =>
    Object.assign(new Error(message), details);
  const aborted = () => makeError("Request cancelled.", { name: "AbortError" });
  const markUnavailable = () => {
    readyUntil = 0;
    publish(
      "offline",
      "The online server is unavailable. Offline play is still available.",
    );
  };

  async function request(path, options = {}) {
    const {
      timeoutMs = 15000,
      anonymous = false,
      signal: outerSignal,
      ...requestOptions
    } = options;
    if (outerSignal?.aborted) throw aborted();
    const method = String(requestOptions.method || "GET").toUpperCase();
    const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const cancel = () => controller.abort();
    outerSignal?.addEventListener("abort", cancel, { once: true });
    const token = anonymous ? "" : readToken();
    try {
      const response = await fetchImpl(base + path, {
        ...requestOptions,
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Token " + token } : {}),
          ...requestOptions.headers,
        },
      });
      const body = await response.text();
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        throw makeError("The online server returned an unexpected response.", {
          code: "BAD_RESPONSE",
          status: response.status,
        });
      }
      if (!response.ok) {
        const detail =
          data.error ||
          data.detail ||
          Object.values(data).flat().join(" ") ||
          "The request could not be completed.";
        throw makeError(
          response.status >= 500
            ? "The online server could not complete this request."
            : String(detail),
          { code: "HTTP_ERROR", status: response.status },
        );
      }
      return data;
    } catch (error) {
      if (outerSignal?.aborted) throw aborted();
      const connectionError =
        timedOut ||
        error.name === "AbortError" ||
        error instanceof TypeError ||
        error.code === "BAD_RESPONSE" ||
        error.status >= 500;
      if (connectionError) {
        markUnavailable();
        const outcomeUnknown = mutating;
        throw makeError(
          outcomeUnknown
            ? "The server did not confirm your action. It may have completed. Refresh the current state before trying it again."
            : timedOut
              ? "The online server took too long to respond."
              : "The online server is unavailable. Please try connecting again.",
          {
            code: timedOut ? "TIMEOUT" : error.code || "NETWORK_ERROR",
            status: error.status,
            outcomeUnknown,
          },
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      outerSignal?.removeEventListener("abort", cancel);
    }
  }

  async function probe() {
    const deadline = now() + warmupTimeoutMs;
    do {
      try {
        const data = await request("/health", {
          anonymous: true,
          timeoutMs: Math.min(healthAttemptTimeoutMs, deadline - now()),
        });
        if (data.status !== "ok" || data.database_reachable === false) {
          throw makeError("The online server is not ready.", {
            code: "NOT_READY",
            status: 503,
          });
        }
        readyUntil = now() + readyForMs;
        readyHealth = data;
        publish("ready");
        return data;
      } catch (error) {
        const permanent =
          error.status >= 400 &&
          error.status < 500 &&
          ![408, 429].includes(error.status);
        const relativeHtml =
          error.code === "BAD_RESPONSE" &&
          error.status < 500 &&
          !/^https?:\/\//i.test(base);
        if (permanent || relativeHtml || now() >= deadline) break;
        publish(
          "connecting",
          "Connecting to the online server. This can take about a minute.",
        );
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(retryDelayMs, deadline - now())),
        );
      }
    } while (now() < deadline);
    markUnavailable();
    throw makeError(
      "The online server is not ready. Check the connection and try again. You can still play offline.",
      { code: "UNAVAILABLE" },
    );
  }

  function ensureReady({ force = false } = {}) {
    if (warming) return warming;
    if (!force && now() < readyUntil) return Promise.resolve(readyHealth);
    warming = Promise.resolve()
      .then(probe)
      .finally(() => {
        warming = null;
      });
    publish(
      "connecting",
      "Connecting to the online server. This can take about a minute.",
    );
    return warming;
  }

  function awaitWithSignal(promise, signal) {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(aborted());
    return new Promise((resolve, reject) => {
      const cancel = () => reject(aborted());
      signal.addEventListener("abort", cancel, { once: true });
      promise.then(resolve, reject).finally(() => {
        signal.removeEventListener("abort", cancel);
      });
    });
  }

  async function api(path, options = {}) {
    if (path === "/health") {
      return awaitWithSignal(ensureReady({ force: true }), options.signal);
    }
    await awaitWithSignal(ensureReady(), options.signal);
    if (options.signal?.aborted) throw aborted();
    const data = await request(path, options);
    readyUntil = now() + readyForMs;
    publish("ready");
    return data;
  }

  return {
    api,
    ensureReady,
    getStatus: () => status,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
