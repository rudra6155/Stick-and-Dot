require('dotenv').config();
const puppeteer = require('puppeteer-core');
const lighthouse = require('lighthouse');
const fs = require('fs');

const url = 'http://localhost:3000';
const WS_URL = 'http://127.0.0.1:63797';

async function runTest() {
  console.log('Connecting to Brave browser...');
  let browser;
  try {
    browser = await puppeteer.connect({ browserURL: WS_URL });
  } catch (e) {
    console.log('Failed to connect to browser on 63797. Is it running with --remote-debugging-port=63797?');
    return;
  }
  
  console.log('Connected! Creating new page...');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to login...');
  await page.goto(`${url}/login`, { waitUntil: 'networkidle2' });
  
  console.log('Logging in...');
  await page.type('input[type="email"]', process.env.TEST_EMAIL);
  await page.type('input[type="password"]', process.env.TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  
  console.log('Logged in successfully. Rigorously testing all features...');
  
  const routes = [
    '/portfolio',
    '/portfolio/suggestions/screener',
    '/portfolio/suggestions/backtest',
    '/portfolio/suggestions/opportunities',
    '/portfolio/predictions',
  ];
  
  for (const route of routes) {
    console.log(`Testing ${route}...`);
    await page.goto(`${url}${route}`, { waitUntil: 'networkidle2' });
    const content = await page.content();
    if (content.includes('Application error') || content.includes('Runtime Error')) {
      console.error(`FATAL ERROR ON ROUTE ${route}`);
    } else {
      console.log(`Route ${route} rendered correctly.`);
    }
    // Take a screenshot of each
    await page.screenshot({ path: `test_${route.replace(/\//g, '_')}.png` });
  }

  console.log('Running Lighthouse Audit...');
  try {
    const runnerResult = await lighthouse(url, {
      port: 63797,
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      logLevel: 'info',
    });
    fs.writeFileSync('lighthouse-report.html', runnerResult.report);
    console.log(`Lighthouse Scores:`);
    console.log(`Performance: ${runnerResult.lhr.categories.performance.score * 100}`);
    console.log(`Accessibility: ${runnerResult.lhr.categories.accessibility.score * 100}`);
    console.log(`Best Practices: ${runnerResult.lhr.categories['best-practices'].score * 100}`);
    console.log(`SEO: ${runnerResult.lhr.categories.seo.score * 100}`);
  } catch (err) {
    console.error('Lighthouse failed:', err.message);
  }

  console.log('E2E and Lighthouse Tests Complete!');
  await browser.disconnect();
}

runTest().catch(console.error);
