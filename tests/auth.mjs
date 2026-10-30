import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
 const page=await browser.newPage();let logins=0, checks=0;let fail=false;
 await page.route('https://beta.gorosen.xyz/api/**',async route=>{
  if(route.request().url().endsWith('/api/open/member/auth')) {
   logins++;const data=route.request().postDataJSON();
   assert.equal(data.mobile,'wj@gorosen.xyz');assert.equal(data.password,createHash('md5').update('123456').digest('hex'));assert.equal(data.captcha,'2');assert.ok(data.lang);
   return route.fulfill({json:fail?{code:50000,msg:'Login unavailable'}:{code:20000,data:{token:'test-login-token'}}});
  }
  checks++;assert.equal(route.request().headers()['x-token'],'test-login-token');
  return route.fulfill({json:{code:20000,msg:'ok'}});
 });
 await page.goto((process.env.BASE_URL||'http://localhost:8080')+'/#/profile');
 await page.waitForFunction(()=>localStorage.getItem('xtoken')==='test-login-token');assert.equal(logins,1);
 await page.reload();await page.getByRole('heading',{name:'Aria Chen',exact:true}).waitFor();assert.equal(logins,1);
 await page.evaluate(async()=>{const {checkPayPalOrder}=await import('/src/api/paypal.js');await checkPayPalOrder('ORDER-123')});assert.equal(checks,1);
 await page.evaluate(()=>localStorage.removeItem('xtoken'));fail=true;
 await page.reload();await page.getByRole('alert').filter({hasText:'Login unavailable'}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('xtoken')),null);
 fail=false;await page.getByRole('button',{name:'Retry sign in'}).click();
 await page.waitForFunction(()=>localStorage.getItem('xtoken')==='test-login-token');
 assert.equal(logins,3);
 console.log('Auth passed: login payload, single login under StrictMode, persisted token, X-Token on PayPal check, failure and retry.');
} finally {await browser.close();}
