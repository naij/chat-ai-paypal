import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
try {
  const page = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.addInitScript(() => localStorage.setItem('xtoken', 'test-auth')); 
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await mkdir('test-results',{recursive:true});
  for (const [id,hours] of [['A',24],['B',240],['C',12]]) {
    await page.goto((process.env.BASE_URL || 'http://localhost:8080')+'/#/chat');
    await page.reload();
    await page.getByRole('button',{name:'I want to earn money',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#app').dataset.stage === 'hire-opportunities' && !document.querySelector('#send').disabled);
    assert.equal(await page.locator('.hire-task').count(),3);
    assert.ok((await page.locator('#messages').textContent()).includes('Great! I have matched you with a few suitable opportunities:'));
    if(id==='A') await page.screenshot({path:'test-results/hire-tasks.png'});
    await page.getByRole('button',{name:`Select Task ${id}`,exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#send').disabled);
    assert.ok((await page.locator('#messages').textContent()).includes(`Great, you have selected Task ${id}, which needs to be completed within ${hours} hours.`));
    await page.getByRole('button',{name:'Submit proof',exact:true}).click();
    if(id==='A') {
      await page.locator('#proof-dialog').getByRole('button',{name:'Submit proof',exact:true}).click();
      await page.getByRole('alert').waitFor();
      await page.locator('#proof-files').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
      assert.ok((await page.getByRole('alert').textContent()).includes('Please choose'));
      await page.locator('#proof-files').setInputFiles('public/assets/frog.png');
      await page.locator('.proof-previews img').waitFor();
      await page.getByRole('button',{name:'Remove image 1'}).click();
      assert.equal(await page.locator('.proof-previews img').count(),0);
      await page.locator('#proof-files').setInputFiles('public/assets/frog.png');
      await page.locator('.proof-previews img').waitFor();
    }
    const description=`Task ${id} finished. <img src=x onerror=alert(1)>`;
    await page.getByLabel('Describe your completed work').fill(description);
    if(id==='A') await page.screenshot({path:'test-results/proof-form.png'});
    await page.locator('#proof-dialog').getByRole('button',{name:'Submit proof',exact:true}).click();
    await page.locator('.proof-receipt').waitFor();
    assert.equal(await page.locator('.proof-text').textContent(),description);
    assert.equal(await page.locator('.proof-text img').count(),0);
    assert.equal(await page.locator('.proof-images img').count(),id==='A'?1:0);
    assert.equal(await page.locator('.hire-task').count(),3);
    await page.waitForFunction(()=>!document.querySelector('#send').disabled);
    assert.ok((await page.locator('#messages').textContent()).includes('The Boss has approved your submission. Please bind your payout method to receive funds.'));
    if(id==='A') await page.screenshot({path:'test-results/proof-submitted.png'});
    const amount = {A:15,B:200,C:10}[id];
    if(id==='B') {
      await page.getByRole('button',{name:'PayPal',exact:true}).click();
      await page.getByRole('button',{name:'Cancel PayPal payment'}).click();
      assert.equal(await page.locator('.payment-success').count(),0);
      await page.getByRole('button',{name:'PayPal',exact:true}).click();
      await page.locator('#confirm-payout').click();
    } else await page.getByRole('button',{name:'PYUSD',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#app').dataset.stage==='hire-paid' && !document.querySelector('#send').disabled);
    const messages=await page.locator('#messages').textContent();
    assert.ok(messages.includes(id==='B' ? `The $${amount} payment has been received in your PayPal account.` : `The ${amount} PYUSD has been transferred to your wallet in Rosen, and you can withdraw it to your private wallet at any time.`));
    assert.ok(messages.includes('Payment Received Successfully and your Credit Score +100'));
    assert.ok(messages.includes('Congratulations! Your credit level has been upgraded.'));
    if(id==='A') await page.screenshot({path:'test-results/payout-success.png'});
    await page.getByRole('button',{name:'View dashboard',exact:true}).click();
    const dashboard=page.getByRole('region',{name:'Payment dashboard'});
    await dashboard.waitFor();
    assert.ok((await dashboard.textContent()).includes(`${id==='B'?'0.00':amount.toFixed(2)} PYUSD`));
    assert.ok((await dashboard.textContent()).includes('+100'));
    if(id==='A') await page.screenshot({path:'test-results/payout-dashboard.png'});
    await page.getByRole('button',{name:'Mastercard · Eligible to apply',exact:true}).click();
    await page.getByText('You’re eligible to apply',{exact:true}).waitFor();
  }
  assert.deepEqual(errors,[]);
  console.log('Hire flow passed: all three tasks and deadlines, automatic reply, proof form validation, image preview/removal, text escaping, receipt, payout amounts for both methods, cancellation, credit score and Mastercard dashboard.');
} finally { await browser.close(); }
