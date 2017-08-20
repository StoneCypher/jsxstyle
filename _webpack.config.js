const fs = require('fs');
const path = require('path');

const testPath = path.join(__dirname, 'src');

// return a multiconfig
module.exports = fs
  .readdirSync(testPath)
  .filter(f => fs.lstatSync(path.join(testPath, f)).isDirectory())
  .map(f => require(path.join(testPath, f, 'webpack.config.js')));
