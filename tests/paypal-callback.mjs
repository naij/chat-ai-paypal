import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(() => localStorage.setItem('xtoken', 'test-auth')); 
 await page.route('https://beta.gorosen.xyz/api/**',route=>route.fulfill({json:{code:20000,msg:'Paid'}}));
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.BASE_URL||'http://localhost:8080';
 await page.goto(base+'/paypal/success?token=SANDBOX-ORDER-123&PayerID=TEST-PAYER');
 await page.getByRole('heading',{name:'Payment successful'}).waitFor();
 assert.equal(await page.locator('#chat-intent-dialog').count(),0);
 await page.getByText('SANDBOX-ORDER-123',{exact:true}).waitFor();
 await page.getByText('Payment completed',{exact:true}).waitFor();
 await page.reload();await page.getByText('TEST-PAYER',{exact:true}).waitFor();
 await page.screenshot({path:'test-results/paypal-return.png'});
 await page.goto(base+'/paypal/success');await page.getByRole('heading',{name:'Unable to identify your order'}).waitFor();
 await page.goto(base+'/paypal/cancel?token=SANDBOX-ORDER-123');await page.getByRole('heading',{name:'Payment cancelled'}).waitFor();
 await page.screenshot({path:'test-results/paypal-cancel.png'});
 await page.getByRole('link',{name:'Return to Chat'}).click();await page.getByRole('button',{name:'I want to hire someone',exact:true}).waitFor();
 await page.goto(base+'/#/paypal/success?token=HASH-ORDER');await page.getByText('HASH-ORDER',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PayPal callback pages passed: direct entry, parameters, refresh, missing token, cancellation, hash route and return to Chat.');
} finally {await browser.close();}
