import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.addInitScript(() => localStorage.setItem('xtoken', 'test-auth')); 
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.BASE_URL||'http://localhost:8080')+'/#/chat');
  const ready=stage=>page.waitForFunction(stage=>document.querySelector('#app').dataset.stage===stage && !document.querySelector('#send').disabled,stage);
  async function restart() {
    await page.locator('#more').click();await page.locator('#restart').click();
    await ready('home');
    assert.ok(await page.locator('#welcome').isVisible());
    assert.ok(await page.locator('#chat-intent-dialog').isVisible());
    assert.equal(await page.locator('#messages').textContent(),'');
    assert.equal(await page.locator('#message-input').inputValue(),'');
  }
  await page.getByRole('button',{name:'I want to hire someone',exact:true}).click();await ready('boss-ready');
  await page.locator('#send').click();await ready('boss-candidates');
  await restart();
  await page.getByRole('button',{name:'I want to earn money',exact:true}).click();await ready('hire-opportunities');
  assert.equal(await page.locator('.hire-task').count(),3);
  await restart();
  await page.getByRole('button',{name:'I want to hire someone',exact:true}).click();await ready('boss-ready');
  await page.locator('#source-deal').click();assert.equal(await page.locator('#app').getAttribute('data-stage'),'boss-ready');
  await page.locator('#more').click();await page.locator('#animate').check();await page.locator('#more').click();
  await page.locator('#send').click();
  await restart();
  await page.waitForTimeout(650);
  assert.equal(await page.locator('#messages').textContent(),'');
  assert.ok(await page.locator('#chat-intent-dialog').isVisible());
  await page.getByRole('button',{name:'I want to hire someone',exact:true}).click();
  await page.locator('.home-art .fortune').click();assert.ok(await page.locator('#chat-intent-dialog').isVisible());
  assert.equal(await page.locator('.opportunity').count(),0);
  assert.deepEqual(errors,[]);
  console.log('Restart passed: both roles, cleared draft/history, role dialog, interrupted streaming, bubbles cannot enter legacy flows.');
} finally {await browser.close();}
