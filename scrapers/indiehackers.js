const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { indiehackers } = require('../utils/config');
const { saveStartups, getSavedStartups } = require('../utils/save');
const { logError } = require('../utils/logger');

puppeteer.use(StealthPlugin());

const LOGIN_EMAIL = 'rodin.avella@gmail.com';
const LOGIN_PASSWORD = 'easytest';
const BASE_URL = 'https://www.indiehackers.com/products';
const LOGIN_URL = 'https://www.indiehackers.com/sign-in';

function extractKey(startup) {
  return startup.name + startup.pitch;
}

async function getCurrentKeys() {
  try {
    const saved = await getSavedStartups();
    const keys = new Set(saved.map(extractKey));
    console.log('🧠 Loaded saved keys from disk:', Array.from(keys));
    return keys;
  } catch {
    return new Set();
  }
}

async function login(page) {
  console.log('🔐 Logging in...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

  await page.waitForSelector('input.pw-sign-in__field--email', { timeout: 10000 });
  await page.type('input.pw-sign-in__field--email', LOGIN_EMAIL, { delay: 30 });
  await page.type('input.pw-sign-in__field--password', LOGIN_PASSWORD, { delay: 30 });

  await page.click('button.pw-sign-in__button');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  console.log('✅ Logged in. Navigating to products page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
}

async function scrapeVisibleStartups(page, selectors) {
  return await page.evaluate((selectors) => {
    const cards = Array.from(document.querySelectorAll(selectors.startupCard));

    console.log('🔢 Total cards on page:', cards.length); // 🔍 Debug: How many cards are we seeing?

    const lastFive = cards.slice(-5); // ✅ Get the last 5 startup cards (bottom of page)

    return lastFive.map(card => {
      const name = card.querySelector(selectors.name)?.textContent?.trim() || 'Unknown';
      const pitch = card.querySelector(selectors.pitch)?.textContent?.trim() || 'Unknown';
      return {
        name,
        pitch,
        founder: 'Unknown',
        sourceURL: null,
        timestamp: new Date().toISOString(),
      };
    });
  }, selectors);
}

async function scrollOnce(page) {
  await page.evaluate(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  });
  await new Promise(res => setTimeout(res, 3000)); // wait for DOM to react
}

async function getUniqueBatch(page, selectors, count, seenKeys) {
  let attempts = 0;
  const maxAttempts = 25;

  while (attempts < maxAttempts) {
    console.log(`🔁 Attempt ${attempts + 1}: Scraping visible startups...`);

    const scraped = await scrapeVisibleStartups(page, selectors); // scrape everything visible

    console.log('🔍 Extracted keys (this attempt):', scraped.map(extractKey));
    console.log('🧠 Already seen keys:', Array.from(seenKeys));

    const fresh = scraped.filter(s => !seenKeys.has(extractKey(s))).slice(0, count);

    if (fresh.length === count) {
      console.log('✅ Found 5 fresh unique startups.');
      console.log('📦 Scraped data preview:', fresh);
      return fresh;
    }

    console.log(`⚠️ Only ${fresh.length} of 5 were new. Scrolling to try again...`);
    await scrollOnce(page);
    attempts++;
  }

  throw new Error('❌ Could not find 5 unique startups after scrolling.');
}

async function scrapeIndieHackers() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  
    try {
      await login(page);
  
      console.log('📜 Scrolling to reveal the product database...');
      await scrollOnce(page);
      await page.waitForSelector(indiehackers.selectors.startupCard, { timeout: 500 });
  
      const seenKeys = await getCurrentKeys();
      const startups = await getUniqueBatch(page, indiehackers.selectors, 5, seenKeys);
  
      console.log('📦 Scraped data preview:', startups);
      await saveStartups(startups);
  
      // ✅ Update in-memory set so future scroll attempts skip duplicates
      startups.forEach(s => seenKeys.add(extractKey(s)));
  
      console.log('🚀 Scraping complete.');
    } catch (err) {
      await logError(err, BASE_URL);
      console.error('❌ Scraping failed:', err.message);
    } finally {
      await browser.close();
    }
  }
  
module.exports = scrapeIndieHackers;