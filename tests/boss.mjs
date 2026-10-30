import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { bossCandidates, bossPrompt, bossProofs } from '../src/bossCandidates.js';
const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.addInitScript(() => localStorage.setItem('xtoken', 'test-auth')); 
  await page.context().route('https://www.sandbox.paypal.com/**',route=>route.fulfill({body:'Sandbox test'}));
  await page.context().route('https://beta.gorosen.xyz/api/**',route=>route.fulfill({json:route.request().url().includes('/create') ? {code:20000,data:{payUrl:'https://www.sandbox.paypal.com/checkoutnow?token=TEST-ORDER'}} : {code:20000,msg:'Paid'}}));
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await mkdir('test-results',{recursive:true});
  const ready=stage=>page.waitForFunction(stage=>document.querySelector('#app').dataset.stage===stage && !document.querySelector('#send').disabled,stage);
  for(const candidate of bossCandidates) {
    await page.goto((process.env.BASE_URL || 'http://localhost:8080')+'/#/chat');await page.reload();
    await page.getByRole('button',{name:'I want to hire someone',exact:true}).click();
    await ready('boss-ready');
    assert.equal(await page.locator('#message-input').inputValue(),bossPrompt);
    assert.equal(await page.locator('.hire-task').count(),0);
    const prompt=candidate.id==='C'?bossPrompt+' I prefer a community event.':bossPrompt;
    await page.locator('#message-input').fill(prompt);
    await page.locator('#send').click();await ready('boss-candidates');
    assert.equal(await page.locator('.user-message').last().textContent(),prompt);
    assert.equal(await page.locator('.hire-task').count(),3);
    for(const person of bossCandidates) assert.ok((await page.locator('#messages').textContent()).includes(`Quote: $${person.quote}`));
    if(candidate.id==='A') await page.screenshot({path:'test-results/boss-candidates.png'});
    await page.getByRole('button',{name:`Select ${candidate.name}`,exact:true}).click();await ready('boss-selected');
    const method=candidate.id==='B'?'PYUSD':'PayPal';
    await page.getByRole('button',{name:method,exact:true}).click();
    assert.ok((await page.locator('.boss-dialog .payment-amount').textContent()).includes(candidate.quote.toFixed(2)));
    await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.getByText('Payment successful.',{exact:true}).count(),0);
    await page.getByRole('button',{name:method,exact:true}).click();
    await page.getByRole('button',{name:/and place order/}).click();
    if(method==='PayPal') await page.getByRole('button',{name:'I’ve completed payment',exact:true}).click();
    await ready('boss-paid');
    assert.equal(await page.getByText('Payment successful.',{exact:true}).count(),1);
    assert.equal(await page.locator('.hire-task').count(),3);
    assert.ok((await page.locator('#messages').textContent()).includes('You have successfully placed the order'));
    if(candidate.id==='A') await page.screenshot({path:'test-results/boss-paid.png'});
    await page.getByRole('button',{name:`View ${candidate.name}’s profile`,exact:true}).click();
    await page.getByRole('heading',{name:candidate.name,exact:true}).waitFor();
    await page.getByRole('button',{name:'Chat',exact:true}).click();
    for (const width of [320, 1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const sizes = await page.locator('.boss-chat-form').evaluate(form => ({ input: form.querySelector('textarea').getBoundingClientRect().width, button: form.querySelector('button').getBoundingClientRect().width, font: parseFloat(getComputedStyle(form.querySelector('button')).fontSize) }));
      assert.ok(sizes.input > 150); assert.equal(sizes.button,64); assert.equal(sizes.font,14);
    }
    await page.locator('#boss-chat-input').fill('A detailed question about the event progress. '.repeat(5));
    await page.waitForFunction(()=>document.querySelector('#boss-chat-input').clientHeight>64);

    await page.getByLabel(`Message to ${candidate.name}`).fill('How is the promotion going? <script>');
    await page.locator('.boss-dialog').getByRole('button',{name:'Send',exact:true}).click();
    assert.ok((await page.getByLabel('Task conversation').textContent()).includes('How is the promotion going? <script>'));
    await page.getByRole('button',{name:'Close dialog'}).click();
    assert.equal(await page.locator('.boss-proof img').getAttribute('src'),bossProofs[candidate.id].image);
    assert.equal(await page.locator('.boss-proof figcaption').textContent(),bossProofs[candidate.id].text);
    await page.waitForFunction(()=>document.querySelector('.boss-proof img').naturalWidth>0);
    await page.getByRole('button',{name:'Reject',exact:true}).click();
    assert.ok((await page.locator('.boss-dialog').textContent()).includes('If you deliberately reject it'));
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    assert.equal(await page.getByText('Your funds/prepayment are refunded.',{exact:true}).count(),0);
    if(candidate.id==='B') {
      await page.getByRole('button',{name:'Reject',exact:true}).click();
      await page.getByRole('button',{name:'Confirm',exact:true}).click();await ready('boss-refunded');
      await page.getByText('Your funds/prepayment are refunded.',{exact:true}).waitFor();
      assert.equal(await page.locator('.boss-invoice').count(),0);
      assert.equal(await page.locator('.boss-dialog').count(),0);
      assert.equal(await page.locator('#messages button:enabled').count(),0);
      assert.equal(await page.locator('#messages .message').last().textContent(),'Your funds/prepayment are refunded.');
      await page.locator('#message-input').fill('Continue');await page.locator('#send').click();
      assert.equal(await page.locator('#app').getAttribute('data-stage'),'boss-refunded');
      assert.equal(await page.locator('#messages .message').last().textContent(),'Your funds/prepayment are refunded.');
    } else {
      await page.getByRole('button',{name:'Approve',exact:true}).click();
      await page.getByRole('button',{name:'Confirm',exact:true}).dblclick();await ready('boss-approved');
      await page.getByText('Payment completed.',{exact:true}).waitFor();
      assert.equal(await page.locator('.boss-invoice').count(),1);
      await page.waitForFunction(()=>document.querySelector('.boss-invoice img').naturalWidth>0);
      assert.ok((await page.locator('#messages').textContent()).includes('Credit Score +200'));
      await page.screenshot({path:`test-results/boss-approved-${candidate.id}.png`});
      // Restoring the review stage must not award credit twice or reverse settlement.
      await page.locator('#back').click();await ready('boss-paid');
      await page.getByRole('button',{name:'Approve',exact:true}).click();
      await page.getByRole('button',{name:'Confirm',exact:true}).click();await ready('boss-approved');
      await page.getByRole('button',{name:'View dashboard',exact:true}).click();
      const dashboard=page.getByRole('region',{name:'Payment dashboard'});await dashboard.waitFor();
      assert.ok((await dashboard.textContent()).includes('+200'));
      assert.ok((await dashboard.textContent()).includes('0.00 PYUSD'));
    }

  }
  assert.deepEqual(errors,[]);
  console.log('Boss flow passed: editable prefill, manual send, all candidates/quotes, both payment methods, cancel, duplicate protection, history, profiles and local chat.');
} finally {await browser.close();}
