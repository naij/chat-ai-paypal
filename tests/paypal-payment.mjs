import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 let paid=false, creates=0, checks=0;
 await context.route('https://www.sandbox.paypal.com/**',route=>route.fulfill({body:'Sandbox checkout test'}));
 await context.route('https://beta.gorosen.xyz/api/**',async route=>{
  const req=route.request(), url=new URL(req.url());
  if(url.pathname.endsWith('/create')) {
   creates++;assert.equal(req.method(),'POST');assert.equal(req.postDataJSON().amount,350);assert.equal(req.headers()['x-token'],'test-auth');
   return route.fulfill({json:{code:20000,msg:'ok',data:{payUrl:'https://www.sandbox.paypal.com/checkoutnow?token=TEST-ORDER-123'}}});
  }
  checks++;assert.equal(url.pathname,'/api/open/paypal/order/check/TEST-ORDER-123');assert.equal(url.searchParams.get('token'),'TEST-ORDER-123');assert.equal(req.headers()['x-token'],'test-auth');
  return route.fulfill({json:{code:paid?20000:40000,msg:paid?'ok':'未完成支付'}});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.BASE_URL||'http://localhost:8080';
 await page.goto(base+'/#/chat');await page.evaluate(()=>localStorage.setItem('xtoken','test-auth'));
 await page.getByRole('button',{name:'I want to hire someone',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#message-input').value.length>100);await page.locator('#send').click();
 await page.waitForFunction(()=>!document.querySelector('#send').disabled);
 await page.getByRole('button',{name:'Select Ruti Avalos',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#send').disabled);
 await page.getByRole('button',{name:'PayPal',exact:true}).click();
 const popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:/and place order/}).click();const popup=await popupPromise;
 await page.getByRole('button',{name:'I’ve completed payment',exact:true}).waitFor();assert.equal(creates,1);
 assert.equal(checks,0);
 await page.getByRole('button',{name:'I haven’t paid',exact:true}).click();
 await page.getByRole('button',{name:'PayPal',exact:true}).click();await page.getByRole('button',{name:/and place order/}).click();assert.equal(creates,1);
 await page.reload();await page.getByRole('button',{name:'I’ve completed payment',exact:true}).waitFor();assert.equal(await page.locator('#chat-intent-dialog').count(),0);
 await page.getByRole('button',{name:'I’ve completed payment',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#app').dataset.stage==='boss-paid'&&!document.querySelector('#send').disabled);
 assert.equal(await page.getByText('Payment successful.',{exact:true}).count(),1);
 assert.equal(checks,0,'Manual confirmation must not query the API');
 await popup.goto(base+'/paypal/success?token=TEST-ORDER-123&PayerID=PAYER-ABC');
 await popup.getByRole('heading',{name:'Payment not confirmed',exact:true}).waitFor();
 assert.ok(checks>0);
 paid=true;await popup.getByRole('button',{name:'重新查询支付状态'}).click();
 await popup.getByRole('heading',{name:'Payment successful',exact:true}).waitFor();
 const beforeCancel=checks;
 await popup.goto(base+'/paypal/cancel?token=TEST-ORDER-123');await popup.getByRole('heading',{name:'Payment cancelled',exact:true}).waitFor();
 assert.equal(checks,beforeCancel);assert.deepEqual(errors,[]);
 console.log('PayPal passed: create payload/auth, sandbox popup, pending/confirmed checks, token/path, unpaid reuse, reload recovery, callbacks and single progression.');
} finally {await browser.close();}
