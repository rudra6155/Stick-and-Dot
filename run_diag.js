const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 1200 });
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('input[type="search"]', { timeout: 10000 });
  
  const result = await page.evaluate(async () => {
    // Force the input to be at the top of the viewport by disabling transforms and scrolling
    const lenisContainer = document.querySelector('.lenis');
    if (lenisContainer) lenisContainer.style.transform = 'none';
    
    const input = document.querySelector('input[type="search"]');
    input.scrollIntoView({ behavior: 'instant', block: 'start' });
    await new Promise(r => setTimeout(r, 500));
    
    const rect = input.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Find all elements at that point manually
    const elements = document.elementsFromPoint(centerX, centerY);
    const blockingElement = elements.find(el => {
      const style = window.getComputedStyle(el);
      return style.pointerEvents !== 'none' && el !== input && !input.contains(el);
    });

    const output = [];
    const log = (...args) => {
      output.push(args.map(a => {
        if (a instanceof Element) {
          return `<${a.tagName.toLowerCase()} class="${a.className || ''}">`;
        }
        if (a instanceof DOMRect) {
          return `DOMRect {x: ${a.x}, y: ${a.y}, width: ${a.width}, height: ${a.height}, top: ${a.top}, right: ${a.right}, bottom: ${a.bottom}, left: ${a.left}}`;
        }
        if (typeof a === 'object' && a !== null) {
          return JSON.stringify(a);
        }
        return String(a);
      }).join(' '));
    };

    log('Input found:', input);
    log('Input bounding box:', rect);
    const elementAtPoint = document.elementFromPoint(centerX, centerY);
    log('Element actually at that point:', elementAtPoint);
    log('Is it the same as input?', elementAtPoint === input);
    log('Computed z-index of input:', getComputedStyle(input).zIndex);
    log('Computed pointer-events of input:', getComputedStyle(input).pointerEvents);
    
    if (elementAtPoint !== input && elementAtPoint !== null) {
      log('BLOCKING ELEMENT tag:', elementAtPoint.tagName);
      log('BLOCKING ELEMENT class:', elementAtPoint.className || '');
      log('BLOCKING ELEMENT z-index:', getComputedStyle(elementAtPoint).zIndex);
    }
    
    return output.join('\n');
  });

  console.log(result);
  await browser.close();
})();
