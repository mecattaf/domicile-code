import {
  SimpleEditorPane, SimpleEditorInput, registerEditorPane, EditorInputCapabilities, type EditorInput,
} from '@codingame/monaco-vscode-views-service-override';
import { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri';
import type { Dimension } from '@codingame/monaco-vscode-api/vscode/vs/base/browser/dom';
import type { IEditorGroup } from '@codingame/monaco-vscode-api/services';
import type { IDisposable } from '@codingame/monaco-vscode-api/vscode/vs/base/common/lifecycle';

export interface NativeEditorHost {
  readonly appId: string;
  readonly title: string;
  mount(parent: HTMLElement): IDisposable;
  focus(): void;
  layout(): void;
  closed(): void;
}

const TYPE = 'domicile-code.nativeEditor';

export class NativeEditorInput extends SimpleEditorInput {
  constructor(readonly host: NativeEditorHost) {
    super(URI.from({ scheme: 'domicile-native', authority: host.appId, path: '/' }));
    this.setName(host.title);
    this.addCapability(EditorInputCapabilities.Singleton);
  }
  get typeId() { return TYPE; }
}

class NativePane extends SimpleEditorPane {
  private host: NativeEditorHost | undefined;
  constructor(group: IEditorGroup) { super(TYPE, group); }
  initialize() {
    const element = document.createElement('div');
    element.className = 'dc-native-editor';
    element.tabIndex = -1;
    return element;
  }
  async renderInput(input: EditorInput): Promise<IDisposable> {
    if (!(input instanceof NativeEditorInput)) throw new Error('The native Pane requires its native input');
    this.host = input.host;
    // Return this mount's own lease. The framework disposes the preceding
    // lease after rendering the next input; a mutable shared lease is unsafe.
    return input.host.mount(this.container);
  }
  clearInput() { super.clearInput(); this.host = undefined; }
  layout(dimension: Dimension) { super.layout(dimension); this.host?.layout(); }
  focus() { super.focus(); this.host?.focus(); }
}

export const registerNativeEditorPane = () => registerEditorPane(TYPE, 'Native application', NativePane, [NativeEditorInput]);
