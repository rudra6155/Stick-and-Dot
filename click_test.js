const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('input[type="search"], input[type="text"]', { timeout: 10000 });
  
  try {
    await page.click('input[type="search"], input[type="text"]');
    console.log("CLICK SUCCESSFUL! Nothing is blocking it.");
  } catch (err) {
    console.log("CLICK FAILED:", err.message);
  }

  await browser.close();
})();
