const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const scrapeIndieHackers = require('./scrapers/indiehackers');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/indiehackers', async (req, res) => {
  try {
    // Run the scraper to update real_startups.json
    await scrapeIndieHackers();

    // Read the JSON file fresh from disk
    const filePath = path.join(__dirname, 'data', 'real_startups.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const startups = JSON.parse(raw);

    // Get the latest 5 startups
    const recent = startups.slice(-5);
    res.json(recent);
  } catch (err) {
    console.error('❌ API Error:', err.message);
    res.status(500).json({ error: 'Failed to scrape startups' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
