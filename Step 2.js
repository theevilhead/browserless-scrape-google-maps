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

// These are class names of some of the specific elements in these cards
const SELECTORS = {
  NAME: '.qBF1Pd.fontHeadlineSmall',
  RATINGS: '.ZkP5Je',
  PRICE: '.wcldff.fontHeadlineSmall.Cbys4b',
  PLACE_TYPE: '.UaQhfb.fontBodyMedium .W4Efsd',
  LINK: '.hfpxzc',
  IMAGE: '.FQ2IWe.p0Hhde'
}

const getData = async (page) => {
  return await page.evaluate((SELECTORS) => {

    let ratingElements = Array.from(document.querySelectorAll(SELECTORS.RATINGS));

    // We are getting the root element of the ratings (star element) here
    // and these are treated as places, all the selector queries will be 
    // done on this element in stead of the whole document
    const placesElement = ratingElements.map(ratingElement => {
      return ratingElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
    });

    const places = [];

    placesElement.forEach((place, index) => {
      const name = (place.querySelector(SELECTORS.NAME)?.textContent || '').trim();
      const rating = ratingElements[index].textContent;
      const price = (place.querySelector(SELECTORS.PRICE)?.textContent || '').trim();
      const type = (place.querySelector(SELECTORS.PLACE_TYPE)?.textContent || '').trim();
      const link = (place.querySelector(SELECTORS.LINK)?.href || '');
      const image = (place.querySelector(SELECTORS.IMAGE)?.children[0].src || '');

      places.push({ name, rating, price, type, link, image });
    })

    return places;
  }, SELECTORS);
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