/**
 * Schedule the next read only after the previous read settles.
 * A paused poll resumes only when its owner explicitly creates a new poll.
 */
export function startSerialPolling({
  task,
  onError = () => {},
  onPause = () => {},
  shouldRetry = () => true,
  intervalMs = 1500,
  failureDelayMs = 5000,
  maxFailures = 3,
  schedule = setTimeout,
  unschedule = clearTimeout,
}) {
  let stopped = false;
  let failures = 0;
  let timer;
  const controller = new AbortController();
  const run = async () => {
    if (stopped) return;
    try {
      await task(controller.signal);
      failures = 0;
    } catch (error) {
      if (stopped || error.name === "AbortError") return;
      failures += 1;
      onError(error);
      if (failures >= maxFailures || !shouldRetry(error)) {
        onPause(error);
        return;
      }
    }
    if (!stopped) timer = schedule(run, failures ? failureDelayMs : intervalMs);
  };
  timer = schedule(run, intervalMs);
  return () => {
    stopped = true;
    controller.abort();
    unschedule(timer);
  };
}
