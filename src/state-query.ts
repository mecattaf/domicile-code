import { Result } from '@cprussin/option-result';
import type { Listening, SystemError } from '@domicile-desktop/sdk/system';

type Command = { sent: number; words: readonly string[] };
type Answer = Result<{ output: string }, string>;
type QueryShell = {
  commands(help: readonly { usage: string; description: string }[], bindings: readonly unknown[]): Promise<Result<Listening<Command>, SystemError>>;
  answer(sent: number, answer: Answer): Promise<Result<'set', SystemError>>;
};
type State = 'unsupported' | 'starting' | 'ready' | 'error' | 'stopped';

// The new command-answer seam is optional. SDK 2.2 types and older engines
// remain supported; only a runtime with both methods can advertise this query.
export function startStateQuery(shell: unknown, snapshot: () => unknown) {
  const supported = shell !== null && typeof shell === 'object'
    && typeof (shell as QueryShell).commands === 'function'
    && typeof (shell as QueryShell).answer === 'function';
  let state: State = supported ? 'starting' : 'unsupported';
  let error: string | undefined;
  let stopped = false;
  let subscription: Listening<Command> | undefined;
  let releaseCurrent: (() => void) | undefined;
  const fail = (reason: unknown) => {
    if (stopped) return;
    state = 'error';
    try { error = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : JSON.stringify(reason); }
    catch { error = String(reason); }
    console.error('Domicile workbench query failed:', error);
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    state = 'stopped';
    releaseCurrent?.();
  };
  const run = async () => {
    const api = shell as QueryShell;
    const registered = await api.commands([{ usage: 'get-workbench', description: 'Read the current Domicile Code fixture and layout state as JSON.' }], []);
    registered.match({ Ok: listening => { subscription = listening; }, Err: fail });
    const listening = subscription;
    if (!listening) return;
    let released = false;
    const release = () => { if (!released) { released = true; listening.stop(); } };
    releaseCurrent = release;
    const ended = listening.ended.then(result => result.match({ Ok: () => undefined, Err: fail })).catch(fail);
    if (stopped) { release(); await ended; return; }
    let reader: ReadableStreamDefaultReader<Command> | undefined;
    try {
      reader = listening.items.getReader();
      state = 'ready';
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) { if (!stopped) fail('The command stream ended unexpectedly'); break; }
        let answer: Answer;
        if (value.words.length !== 1 || value.words[0] !== 'get-workbench') {
          answer = Result.Err('Use get-workbench without arguments; this query is read-only.');
        } else {
          try {
            const output = JSON.stringify(snapshot());
            if (typeof output !== 'string') throw new Error('The workbench snapshot is not JSON');
            answer = Result.Ok({ output });
          } catch (reason) { answer = Result.Err(reason instanceof Error ? reason.message : String(reason)); }
        }
        const reply = await api.answer(value.sent, answer);
        let refused = false;
        reply.match({ Ok: () => undefined, Err: reason => { refused = true; fail(reason); } });
        if (refused) break;
      }
    } finally {
      reader?.releaseLock();
      release();
      await ended;
    }
  };
  if (supported) void run().catch(fail);
  return { status: () => ({ state, ...(error === undefined ? {} : { error }) }), stop };
}
