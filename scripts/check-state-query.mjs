import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { Result } from '@cprussin/option-result';
import { startStateQuery } from '../src/state-query.ts';

const tick = () => setTimeout(0);
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
function fixture() {
  const registration = deferred(), ended = deferred();
  let controller, stops = 0;
  const replies = [];
  const listening = {
    items: new ReadableStream({ start(value) { controller = value; } }),
    ended: ended.promise,
    stop() { stops++; controller.close(); ended.resolve(Result.Ok('stopped')); },
  };
  const shell = {
    commands(help, bindings) { assert.equal(help[0].usage, 'get-workbench'); assert.deepEqual(bindings, []); return registration.promise; },
    async answer(sent, result) { replies.push({ sent, result }); return Result.Ok('set'); },
  };
  return { registration, ended, listening, shell, replies, controller: () => controller, stops: () => stops };
}

const unsupported = startStateQuery({ commands() { assert.fail('Old API must not be called'); } }, () => ({}));
assert.equal(unsupported.status().state, 'unsupported');

const delayed = fixture();
const stopped = startStateQuery(delayed.shell, () => ({}));
stopped.stop(); stopped.stop();
delayed.registration.resolve(Result.Ok(delayed.listening));
await tick();
assert.equal(stopped.status().state, 'stopped');
assert.equal(delayed.stops(), 1, 'Stopping before registration leaked or released twice');
assert.equal(delayed.listening.items.locked, false);

const active = fixture();
const query = startStateQuery(active.shell, () => ({ fixture: 'public', modelVersion: 2 }));
active.registration.resolve(Result.Ok(active.listening));
await tick();
assert.equal(query.status().state, 'ready');
active.controller().enqueue({ sent: 1, words: ['get-workbench'] });
active.controller().enqueue({ sent: 2, words: ['get-workbench', 'mutate'] });
await tick();
assert.deepEqual(JSON.parse(active.replies[0].result.match({ Ok: value => value.output, Err: assert.fail })), { fixture: 'public', modelVersion: 2 });
assert.match(active.replies[1].result.match({ Ok: assert.fail, Err: value => value }), /read-only/);
query.stop(); await tick();
assert.equal(active.stops(), 1);
assert.equal(active.listening.items.locked, false);

const refused = startStateQuery({ commands: async () => Result.Err({ kind: 'refused' }), answer() { assert.fail(); } }, () => ({}));
await tick(); assert.equal(refused.status().state, 'error');
assert.match(refused.status().error, /refused/);
const brokenAnswer = fixture();
brokenAnswer.shell.answer = async () => Result.Err({ kind: 'answer-refused' });
const failed = startStateQuery(brokenAnswer.shell, () => ({}));
brokenAnswer.registration.resolve(Result.Ok(brokenAnswer.listening));
await tick(); brokenAnswer.controller().enqueue({ sent: 3, words: ['get-workbench'] });
await tick();
assert.equal(failed.status().state, 'error');
assert.match(failed.status().error, /answer-refused/);
assert.equal(brokenAnswer.stops(), 1);
assert.equal(brokenAnswer.listening.items.locked, false);

console.log(JSON.stringify({ result: 'pass', checks: ['older runtime capability refusal', 'stop before registration releases exactly once', 'read-only state reply and extra-argument refusal', 'reader lock release', 'registration failure is visible', 'answer refusal stops and releases the reader'] }));
