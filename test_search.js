const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const logs = [];
  const requests = [];

  page.on('console', msg => logs.push(msg.text()));
  page.on('request', request => {
    if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr' || request.url().includes('supabase')) {
      requests.push({ url: request.url(), method: request.method() });
    }
  });

  console.log("Navigating to http://localhost:3000...");
  await page.goto('http://localhost:3000');
  
  console.log("Waiting for input...");
  await page.waitForSelector('input[type="text"]');
  
  console.log("Typing 'AAPL'...");
  await page.type('input[type="text"]', 'AAPL', { delay: 100 });
  
  console.log("Waiting 1000ms for debounce...");
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("--- BROWSER CONSOLE LOGS ---");
  logs.forEach(l => console.log(l));
  
  console.log("--- BROWSER NETWORK REQUESTS (FETCH/XHR/SUPABASE) ---");
  requests.forEach(r => console.log(r.method, r.url));
  
  await browser.close();
})();
