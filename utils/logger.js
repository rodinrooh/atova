const fs = require('fs').promises;
const path = require('path');
const logPath = path.join(__dirname, '../data/errors.log');

async function logError(err, context) {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] Context: ${context}\n${err.stack}\n\n`;
  await fs.appendFile(logPath, msg);
}

module.exports = { logError };