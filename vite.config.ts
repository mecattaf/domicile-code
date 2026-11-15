import { defineConfig, type Plugin } from 'vite';
import { posix } from 'node:path';

const shellPlugin = (): Plugin => ({
  name: 'shell-css-inject',
  generateBundle(_, bundle) {
    let css = '';
    const cssKeys: string[] = [];
    for (const key of Object.keys(bundle)) {
      const asset = bundle[key];
      if (asset.type === 'asset' && asset.fileName.endsWith('.css')) {
        const text = typeof asset.source === 'string' ? asset.source : Buffer.from(asset.source).toString('utf-8');
        // A stylesheet under assets/ resolves relative URLs there. Inlining
        // must preserve that location when the shell document owns the style.
        css += text.replace(/url\(\s*(?:(["'])(.*?)\1|([^"')\s]+))\s*\)/g, (original, _quote, quoted, bare) => {
          const value = quoted ?? bare;
          if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return original;
          return `url(${JSON.stringify(`./${posix.join(posix.dirname(asset.fileName), value)}`)})`;
        });
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
  const isShell = mode === 'shell' || mode === 'shell-language';
  const language = mode === 'language' || mode === 'shell-language';
  return {
    base: './',
    define: { __DC_LANGUAGE_EXTENSION__: JSON.stringify(language) },
    build: {
      target: 'esnext',
      minify: false,
      outDir: language ? (isShell ? 'dist/language-shell/shell' : 'dist/language') : (isShell ? 'dist/shell' : 'dist/browser'),
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
