const processedCallbacks = new Map<string, number>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, timestamp] of processedCallbacks) {
    if (now - timestamp > MAX_AGE_MS) {
      processedCallbacks.delete(id);
    }
  }
}, CLEANUP_INTERVAL_MS);

export function isDuplicate(callbackId: string): boolean {
  return processedCallbacks.has(callbackId);
}

export function markProcessed(callbackId: string): void {
  processedCallbacks.set(callbackId, Date.now());
}
