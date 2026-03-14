const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  // This ensures the browser is installed in the project folder for Render.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};