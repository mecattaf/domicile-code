onmessage = event => {
  const buffer = event.data.buffer;
  const result = { crossOriginIsolated, sharedArrayBufferType: typeof SharedArrayBuffer, receivedSharedBuffer: false };
  if (typeof SharedArrayBuffer === 'function' && buffer instanceof SharedArrayBuffer) {
    result.receivedSharedBuffer = true;
    Atomics.add(new Int32Array(buffer), 0, 1);
    result.value = Atomics.load(new Int32Array(buffer), 0);
  }
  postMessage(result);
};
