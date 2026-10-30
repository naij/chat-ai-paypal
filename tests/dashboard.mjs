import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 const page = await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 page.on('console', m=>{if(m.type()==='error' || m.type()==='warning') console.log(m.text().slice(0,350));});
 await page.goto('http://localhost:8080/#/dashboard');
 await page.getByRole('button',{name:'Transactions',exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelectorAll('canvas').length>=4);
 await page.screenshot({path:'test-results/dashboard.png',fullPage:true});
 await page.getByRole('button',{name:'Transactions',exact:true}).click();
 await page.getByText('DEMO-1001',{exact:true}).first().waitFor();
 await page.getByRole('checkbox',{name:'Refunded',exact:true}).check();
 await page.getByText('DEMO-1002',{exact:true}).first().waitFor({state:'hidden'});
 assert.equal(await page.getByText('DEMO-1001',{exact:true}).first().isVisible(),true);
 await page.getByRole('checkbox',{name:'Refunded',exact:true}).uncheck();
 await page.getByRole('button',{name:'Edit dashboard',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Done editing'}).count(),1);
 await page.getByRole('button',{name:'Done editing'}).click();
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Dashboard charts, transaction data, edit toggle and mobile shell passed.');
} finally {await browser.close();}
