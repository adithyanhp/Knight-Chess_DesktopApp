import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "./api-client.js";
import { startSerialPolling } from "./polling.js";
import { recoverLatestServerGame } from "./server.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("concurrent actions share one anonymous warm-up before authenticated requests", async () => {
  const health = deferred();
  const calls = [];
  const phases = [];
  const client = createApiClient({
    baseUrl: "https://backend.example/api/",
    readToken: () => "test-token",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/health")) return health.promise;
      return json({ path: url });
    },
  });
  client.subscribe(() => phases.push(client.getStatus().phase));
  const profile = client.api("/profile");
  const games = client.api("/games");
  await Promise.resolve();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://backend.example/api/health");
  assert.equal(calls[0].options.headers.Authorization, undefined);
  health.resolve(json({ status: "ok", database_reachable: true }));
  await Promise.all([profile, games]);
  assert.equal(calls.filter((c) => c.url.endsWith("/health")).length, 1);
  assert.equal(calls.length, 3);
  for (const call of calls.slice(1))
    assert.equal(call.options.headers.Authorization, "Token test-token");
  assert.equal(phases[0], "connecting");
  assert.equal(client.getStatus().phase, "ready");
});

test("only the health GET is retried while a backend wakes", async () => {
  let probes = 0;
  let actions = 0;
  const client = createApiClient({
    retryDelayMs: 1,
    warmupTimeoutMs: 500,
    fetchImpl: async (url) => {
      if (url.endsWith("/health")) {
        probes += 1;
        return probes === 1
          ? json({ status: "unavailable" }, 503)
          : json({ status: "ok", database_reachable: true });
      }
      actions += 1;
      return json({ id: "new-game" });
    },
  });
  const game = await client.api("/games", { method: "POST", body: "{}" });
  assert.equal(game.id, "new-game");
  assert.equal(probes, 2);
  assert.equal(actions, 1);
});

test("warm-up stops at its deadline without sending a pending mutation", async () => {
  let actions = 0;
  const client = createApiClient({
    retryDelayMs: 1,
    warmupTimeoutMs: 20,
    fetchImpl: async (url) => {
      if (url.endsWith("/health"))
        return json({ status: "unavailable", database_reachable: false }, 503);
      actions += 1;
      return json({});
    },
  });
  await assert.rejects(
    client.api("/games", { method: "POST", body: "{}" }),
    (error) => error.code === "UNAVAILABLE",
  );
  assert.equal(actions, 0);
  assert.equal(client.getStatus().phase, "offline");
});

test("a timed-out mutation is never replayed and reports an uncertain outcome", async () => {
  let actions = 0;
  const client = createApiClient({
    fetchImpl: async (url, { signal }) => {
      if (url.endsWith("/health")) return json({ status: "ok" });
      actions += 1;
      return new Promise((resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        ),
      );
    },
  });
  await assert.rejects(
    client.api("/games/id/move", {
      method: "POST",
      body: '{"uci":"e2e4"}',
      timeoutMs: 5,
    }),
    (error) => error.code === "TIMEOUT" && error.outcomeUnknown === true,
  );
  assert.equal(actions, 1);
  assert.equal(client.getStatus().phase, "offline");
});

test("cancelling one waiting caller does not cancel a shared warm-up or send its mutation", async () => {
  const health = deferred();
  const abort = new AbortController();
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url) => {
      calls.push(url);
      return url.endsWith("/health") ? health.promise : json({ ok: true });
    },
  });
  const cancelled = client.api("/games", {
    method: "POST",
    signal: abort.signal,
  });
  const other = client.api("/profile");
  abort.abort();
  await assert.rejects(cancelled, (error) => error.name === "AbortError");
  health.resolve(json({ status: "ok" }));
  await other;
  assert.deepEqual(calls, ["/api/health", "/api/profile"]);
});

test("validation failures do not replay requests or mark the backend offline", async () => {
  let probes = 0;
  let actions = 0;
  const client = createApiClient({
    fetchImpl: async (url) => {
      if (url.endsWith("/health")) {
        probes += 1;
        return json({ status: "ok" });
      }
      actions += 1;
      return json({ error: "Incorrect password." }, 400);
    },
  });
  await assert.rejects(
    client.api("/auth/login", { method: "POST" }),
    (error) => error.status === 400 && !error.outcomeUnknown,
  );
  assert.equal(probes, 1);
  assert.equal(actions, 1);
  assert.equal(client.getStatus().phase, "ready");
});

test("game polling schedules no next read until the current read settles", async () => {
  const scheduled = [];
  const first = deferred();
  let reads = 0;
  const stop = startSerialPolling({
    task: async () => {
      reads += 1;
      await first.promise;
    },
    schedule: (run) => {
      scheduled.push(run);
      return run;
    },
    unschedule: () => {},
  });
  assert.equal(scheduled.length, 1);
  const running = scheduled.shift()();
  assert.equal(reads, 1);
  assert.equal(scheduled.length, 0);
  await Promise.resolve();
  assert.equal(reads, 1);
  first.resolve();
  await running;
  assert.equal(scheduled.length, 1);
  stop();
  await scheduled.shift()();
  assert.equal(reads, 1);
});

test("game polling pauses after bounded failures and needs an explicit restart", async () => {
  const scheduled = [];
  let reads = 0;
  let paused = 0;
  const stop = startSerialPolling({
    task: async () => {
      reads += 1;
      throw new Error("Disconnected");
    },
    maxFailures: 2,
    onPause: () => paused++,
    schedule: (run) => {
      scheduled.push(run);
      return run;
    },
    unschedule: () => {},
  });
  await scheduled.shift()();
  await scheduled.shift()();
  assert.equal(reads, 2);
  assert.equal(paused, 1);
  assert.equal(scheduled.length, 0);
  stop();
});

test("poll cleanup aborts its read and never schedules another one", async () => {
  const scheduled = [];
  let signal;
  let errors = 0;
  const stop = startSerialPolling({
    task: (requestSignal) => {
      signal = requestSignal;
      return new Promise((resolve, reject) =>
        signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        ),
      );
    },
    onError: () => errors++,
    schedule: (run) => {
      scheduled.push(run);
      return run;
    },
    unschedule: () => {},
  });
  const running = scheduled.shift()();
  stop();
  await running;
  assert.equal(signal.aborted, true);
  assert.equal(errors, 0);
  assert.equal(scheduled.length, 0);
});

test("a lost game-creation response is recovered by GET and clock-settled detail", async () => {
  const calls = [];
  let created = false;
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      calls.push({ url, method: options.method });
      if (url.endsWith("/health")) return json({ status: "ok" });
      if (url === "/api/games" && options.method === "POST") {
        created = true;
        throw new TypeError(
          "The response was lost after the server committed.",
        );
      }
      if (url === "/api/games")
        return json({
          games: created ? [{ id: "game-1", status: "active" }] : [],
        });
      if (url === "/api/games/game-1")
        return json({
          id: "game-1",
          status: "finished",
          termination: "timeout",
          white_seconds: 0,
        });
      throw new Error("Unexpected request: " + url);
    },
  });
  await assert.rejects(
    client.api("/games", { method: "POST", body: "{}" }),
    (error) => error.outcomeUnknown === true,
  );
  const recovered = await recoverLatestServerGame(client.api);
  assert.equal(recovered.id, "game-1");
  assert.equal(recovered.status, "finished");
  assert.equal(recovered.white_seconds, 0);
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  assert.deepEqual(calls.slice(-2), [
    { url: "/api/games", method: "GET" },
    { url: "/api/games/game-1", method: "GET" },
  ]);
});

test("recovery includes waiting rooms and skips finished games", async () => {
  const calls = [];
  const recovered = await recoverLatestServerGame(async (path) => {
    calls.push(path);
    if (path === "/games")
      return {
        games: [
          { id: "finished", status: "finished" },
          { id: "room-1", status: "waiting" },
        ],
      };
    return { id: "room-1", status: "waiting", code: "ABCD1234" };
  });
  assert.equal(recovered.code, "ABCD1234");
  assert.deepEqual(calls, ["/games", "/games/room-1"]);
});
