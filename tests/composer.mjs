import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.addInitScript(() => localStorage.setItem('xtoken', 'test-auth')); 
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.BASE_URL||'http://localhost:8080')+'/#/chat');
 await page.getByRole('button',{name:'I want to hire someone',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#message-input').value.length>100);
 assert.equal(await page.locator('#voice').count(),0);
 for(const width of [390,320,480]) {
  await page.setViewportSize({width,height:844});
  await page.waitForFunction(()=>{const el=document.querySelector('#message-input');return el.scrollHeight<=el.clientHeight+1});
  assert.ok(await page.locator('#message-input').evaluate(el=>el.clientHeight>60));
 }
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'test-results/composer-expanded.png'});
 const expanded=await page.locator('#message-input').evaluate(el=>el.clientHeight);
 await page.locator('#message-input').fill('Hello');
 await page.waitForFunction(()=>document.querySelector('#message-input').clientHeight<40);
 assert.ok(expanded>40);
 await page.locator('#message-input').fill('A long message. '.repeat(100));
 await page.waitForFunction(()=>document.querySelector('#message-input').scrollHeight>document.querySelector('#message-input').clientHeight);
 assert.ok(await page.locator('#message-input').evaluate(el=>el.clientHeight<=320));
 assert.deepEqual(errors,[]);
 console.log('Composer passed: prefill fully visible at 320/390/480px, shrinks on deletion, long input scrolls, no voice button.');
} finally {await browser.close();}
