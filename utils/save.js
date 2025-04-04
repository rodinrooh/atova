const fs = require('fs').promises;
const path = require('path');

const outputPath = path.join(__dirname, '../data/real_startups.json');

async function saveStartups(newData) {
  try {
    let existing = [];

    try {
      const raw = await fs.readFile(outputPath, 'utf-8');
      existing = JSON.parse(raw);
    } catch (_) {}

    const extractKey = (startup) => startup.name + startup.pitch;

    const existingKeys = new Set(existing.map(extractKey));
    console.log('💾 Checking against saved keys:', Array.from(existingKeys));
    
    const deduped = newData.filter(item => !existingKeys.has(extractKey(item)));


    const updated = [...existing, ...deduped];
    await fs.writeFile(outputPath, JSON.stringify(updated, null, 2));

    console.log(`📝 Saved ${deduped.length} new unique startups.`);
  } catch (err) {
    console.error('💥 Failed to save startups:', err.message);
  }
}

async function getSavedStartups() {
  try {
    const raw = await fs.readFile(outputPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('💥 Failed to read saved startups:', err.message);
    return [];
  }
}

module.exports = { saveStartups, getSavedStartups };