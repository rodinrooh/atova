const scrapeIndieHackers = require('../scrapers/indiehackers');

async function run() {
  const arg = process.argv[2];

  switch (arg) {
    case 'indiehackers':
      await scrapeIndieHackers();
      break;
    default:
      console.log('Usage: node src/scraper.js indiehackers');
  }
}

run();