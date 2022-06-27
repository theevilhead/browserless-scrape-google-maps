// script.js
// You can also use puppeteer core, know more about it here https://developers.google.com/web/tools/puppeteer/get-started#puppeteer-core
const puppeteer = require('puppeteer');

const API_TOKEN = process.env.API_TOKEN;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// In prod: Connect to browserless so we don't run Chrome on the same hardware
// In dev: Run the browser locally
const getBrowser = () => IS_PRODUCTION 
  ? puppeteer.connect({
    browserWSEndpoint: 'wss://chrome.browserless.io?token=' + API_TOKEN,
  }) 
  : puppeteer.launch({headless: false} );

(async () => {
  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    // Connect to remote endpoint
    // Reset the viewport for more results in single page of google maps.
    await page.setViewport({ width: 1440, height: 789 })

    // Visit maps.google.com
    await page.goto('https://maps.google.com')

    // Wait till the page loads and an input field with id searchboxinput is present
    await page.waitForSelector('#searchboxinput')
    // Simulate user click
    await page.click('#searchboxinput')

    // Type our search query
    await page.type('#searchboxinput', "Hotels in dublin, Ireland");
    // Simulate pressing Enter key
    await page.keyboard.press('Enter');

    console.log("Completed");

    browser.close();

  } catch (error) {
    console.log(error)
  }
})();