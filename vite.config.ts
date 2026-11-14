import { defineConfig, type Plugin } from 'vite';

const shellPlugin = (): Plugin => ({
  name: 'shell-css-inject',
  generateBundle(_, bundle) {
    let css = '';
    const cssKeys: string[] = [];
    for (const key of Object.keys(bundle)) {
      const asset = bundle[key];
      if (asset.type === 'asset' && asset.fileName.endsWith('.css')) {
        css += typeof asset.source === 'string' ? asset.source : Buffer.from(asset.source).toString('utf-8');
        cssKeys.push(key);
      }
    }
    if (!css) return;
    const code = `const style = document.createElement("style"); style.textContent = ${JSON.stringify(css)}; document.head.append(style);\n`;
    let entryFound = false;
    for (const key of Object.keys(bundle)) {
      const chunk = bundle[key];
      if (chunk.type === 'chunk' && chunk.isEntry) {
        chunk.code = code + chunk.code;
        entryFound = true;
      }
    }
    if (!entryFound) throw new Error("No entry chunk found for CSS injection");
    for (const key of cssKeys) delete bundle[key];
  }
});

export default defineConfig(({ mode }) => {
  const isShell = mode === 'shell';
  return {
    base: './',
    build: {
      target: 'esnext',
      minify: false,
      outDir: isShell ? 'dist/shell' : 'dist/browser',
      rollupOptions: {
        ...(isShell ? {
          input: 'src/shell.ts',
          preserveEntrySignatures: 'exports-only',
          output: { entryFileNames: 'shell.js' }
        } : {})
      }
    },
    worker: { format: 'es', plugins: () => [] },
    plugins: isShell ? [shellPlugin()] : []
  };
});
