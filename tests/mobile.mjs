import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('xtoken', 'test-auth')); 
  await page.goto((process.env.BASE_URL || 'http://localhost:8080') + '/#/chat');
  await page.getByRole('button', { name: 'I want to hire someone', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#app').dataset.stage === 'boss-ready');
  assert.match(await page.locator('meta[name="viewport"]').getAttribute('content'), /user-scalable=no/);
  await page.locator('#send').click();
  await page.waitForFunction(() => document.querySelector('#app').dataset.stage === 'boss-candidates' && !document.querySelector('#send').disabled);
  await page.locator('#message-input').focus();
  await page.setViewportSize({ width: 390, height: 480 });
  await page.waitForFunction(() => document.querySelector('#app').classList.contains('keyboard-open'));
  const result = await page.evaluate(() => {
    const input = document.querySelector('#message-input'), conversation = document.querySelector('#conversation');
    return { bottom: document.querySelector('#composer').getBoundingClientRect().bottom, height: visualViewport.height, contentHeight: conversation.clientHeight, gap: conversation.scrollHeight - conversation.scrollTop - conversation.clientHeight, font: parseFloat(getComputedStyle(input).fontSize), scrollbar: getComputedStyle(input).scrollbarWidth };
  });
  assert.ok(result.bottom <= result.height + 1);
  assert.ok(result.contentHeight > 200);
  assert.ok(result.gap < 3);
  assert.ok(result.font >= 16);
  assert.equal(result.scrollbar, 'none');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.querySelector('#app').classList.contains('keyboard-open'));
  console.log('Mobile viewport simulation passed: keyboard open/close, bottom anchoring, input font, hidden scrollbar, zoom settings.');
} finally { await browser.close(); }
