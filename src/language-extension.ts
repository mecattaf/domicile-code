import getExtensionsServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
import ExtensionHostWorkerURL from '@codingame/monaco-vscode-api/workers/extensionHost.worker?worker&url';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';

/** Experimental browser language lane; it is not part of the default shell. */
export function languageExtension() {
  return {
    services: getExtensionsServiceOverride({ enableWorkerExtensionHost: true }),
    workerUrl: new URL(ExtensionHostWorkerURL, import.meta.url).href,
  };
}
