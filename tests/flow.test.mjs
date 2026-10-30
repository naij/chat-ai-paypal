import test from 'node:test';
import assert from 'node:assert/strict';
import { stageMessages, activeActions, richTokens } from '../src/chat.js';
test('only the two current role flows have actions', () => {
  assert.ok(Object.keys(activeActions).every(stage => /^(boss|hire)-/.test(stage)));
  for (const stage of ['opportunities','matched','withdrawal','paypal','paid','summary','credit','complete']) assert.deepEqual(stageMessages(stage),[]);
});
test('current roles retain three choices and review controls', () => {
  assert.equal(stageMessages('boss-candidates').filter(message=>message.candidate).length,3);
  assert.equal(stageMessages('hire-opportunities').filter(message=>message.task).length,3);
  assert.ok(activeActions['boss-paid'].includes('boss-approve'));
  assert.ok(activeActions['hire-submitted'].includes('payout-pyusd'));
});
test('script formatting retains safe text tokens', () => {
  assert.deepEqual(richTokens('Hello <strong>Stellar</strong><br>Welcome'),[{text:'Hello ',bold:false},{text:'Stellar',bold:true},{br:true},{text:'Welcome',bold:false}]);
});
