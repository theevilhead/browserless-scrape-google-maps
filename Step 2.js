// You can also use puppeteer core, know more about it here https://developers.google.com/web/tools/puppeteer/get-started#puppeteer-core
const puppeteer = require('puppeteer');

const API_TOKEN = process.env.API_TOKEN;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// In prod: Connect to browserless so we don't run Chrome on the same hardware
// In dev: Run the browser locally while in development
const getBrowser = () => IS_PRODUCTION
  ? puppeteer.connect({
    browserWSEndpoint: 'wss://chrome.browserless.io?token=' + API_TOKEN,
  })
  : puppeteer.launch({ headless: false }); // { headless: false } helps visualize and debug the process easily.

// These are classNames of some of the specific elements in these cards
const SELECTORS = {
  NAME: '.qBF1Pd.fontHeadlineSmall',
  LISTING: 'a[href^="https://www.google.com/maps/place/',
  RATINGS: '.ZkP5Je',
  PRICE: '.wcldff.fontHeadlineSmall.Cbys4b',
  LINK: '.hfpxzc',
  IMAGE: '.FQ2IWe.p0Hhde',
  NAV_BUTTONS: '.TQbB2b',
};

// Scrapes the data from the page
const getData = async (page, currentPageNum) => {
  return await page.evaluate((opts) => {
    const { selectors: SELECTORS } = opts;

    const elements = document.querySelectorAll(SELECTORS.LISTING);
    const placesElements = Array.from(elements).map(element => element.parentElement);

    const places = placesElements.map((place, index) => {
      // Getting the names
      const name = (place.querySelector(SELECTORS.NAME)?.textContent || '').trim();
      const rating = (place.querySelector(SELECTORS.RATINGS)?.textContent || '').trim();
      const price = (place.querySelector(SELECTORS.PRICE)?.textContent || '').trim();
      const link = (place.querySelector(SELECTORS.LINK)?.href || '');
      const image = (place.querySelector(SELECTORS.IMAGE)?.children[0].src || '');

      return { name, rating, price, link, image };
    })

    return places;
  }, { selectors: SELECTORS, currentPageNum });
}

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

    // Wait for the page to load results.
    await page.waitForSelector(SELECTORS.RATINGS);

    // Get our final structured data
    const finalData = await getData(page);

    console.log("Final data", finalData);

    browser.close();
    return finalData;

  } catch (error) {
    console.log(error)
  }

})();