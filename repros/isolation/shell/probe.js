export async function startProbe(root) {
  const result = { status: 'starting', secureContext: isSecureContext, crossOriginIsolated,
    sharedArrayBufferType: typeof SharedArrayBuffer, scriptFetch: null, workers: [] };
  window.domicileIsolationProbe = result;
  const title = document.createElement('h1');
  title.textContent = 'Domicile shared-memory and worker probe';
  const output = document.createElement('pre');
  root.style.cssText = 'padding:32px;background:#20242a;color:#eee;min-height:100vh;box-sizing:border-box;font:16px monospace';
  root.replaceChildren(title, output);
  const render = () => { output.textContent = JSON.stringify(result, null, 2); };
  render();
  const entry = new URL('./worker.js', import.meta.url);
  const runWorker = type => new Promise(resolve => {
    let worker, timer;
    const finish = report => { clearTimeout(timer); worker?.terminate(); resolve({ type, ...report }); };
    try {
      worker = new Worker(entry, { type });
      timer = setTimeout(() => finish({ result: 'timeout' }), 5000);
      let buffer;
      if (typeof SharedArrayBuffer === 'function') {
        buffer = new SharedArrayBuffer(4);
        new Int32Array(buffer)[0] = 41;
      }
      worker.onmessage = event => finish({ result: 'message', worker: event.data,
        ...(buffer ? { sharedValueAfterWorker: Atomics.load(new Int32Array(buffer), 0) } : {}) });
      worker.onerror = event => finish({ result: 'error', error: {
        message: event.message || 'Worker startup failed', filename: event.filename ?? null, line: event.lineno ?? null,
      } });
      worker.postMessage({ buffer });
    } catch (error) { finish({ result: 'error', error: { message: String(error.message) } }); }
  });
  try {
    const response = await fetch(entry);
    result.scriptFetch = { status: response.status, mimeType: response.headers.get('content-type'), url: entry.href };
    result.workers = await Promise.all(['classic', 'module'].map(runWorker));
    result.status = 'complete'; // The measurements completed; individual workers can fail.
  } catch (error) {
    result.status = 'failed';
    result.error = String(error.message);
  } finally { render(); }
}
