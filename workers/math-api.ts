/**
 * Typed Comlink wrapper for the math web worker.
 *
 * Lazily creates the worker on first call and returns a proxy
 * whose methods mirror `MathWorkerAPI` but return Promises.
 */

import * as Comlink from "comlink";
import type { MathWorkerAPI } from "./math.worker";

let worker: Worker | null = null;
let proxy: Comlink.Remote<MathWorkerAPI> | null = null;

export function getMathWorker(): Comlink.Remote<MathWorkerAPI> {
  if (!proxy) {
    worker = new Worker(new URL("./math.worker.ts", import.meta.url));
    proxy = Comlink.wrap<MathWorkerAPI>(worker);
  }
  return proxy;
}

/**
 * Terminate the worker (for cleanup / HMR).
 */
export function terminateMathWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    proxy = null;
  }
}
