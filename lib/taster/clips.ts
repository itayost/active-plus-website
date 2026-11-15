"use client";

/**
 * Downloads the next clips whole while the current one plays, so the next
 * exercise starts at once. Each becomes a blob: URL; a clip that has not
 * arrived yet (or failed) plays from its own address, streaming as before.
 * The clips are 2-6 MB each after transcoding, a few per workout.
 */
export function clipLoader() {
  const ready = new Map<string, string>();
  const pending = new Map<string, Promise<void>>();
  const controller = new AbortController();

  const load = (url: string): Promise<void> => {
    if (ready.has(url)) return Promise.resolve();
    const running = pending.get(url);
    if (running) return running;
    const job = fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`clip ${r.status}`))))
      .then((blob) => {
        ready.set(url, URL.createObjectURL(blob));
      })
      .catch(() => {
        // Streams from its address instead.
      })
      .finally(() => pending.delete(url));
    pending.set(url, job);
    return job;
  };

  return {
    /** Starts the downloads one after another, nearest first. */
    preload(urls: readonly string[]) {
      void urls.reduce<Promise<void>>((chain, url) => chain.then(() => load(url)), Promise.resolve());
    },
    /** The address to play: the downloaded copy when it is here. */
    source: (url: string) => ready.get(url) ?? url,
    dispose() {
      controller.abort();
      ready.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
      ready.clear();
    },
  };
}
