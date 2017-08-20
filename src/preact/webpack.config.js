const path = require('path');

module.exports = require('wub')([
  [
    'preact',
    {
      rootComponent: './app.js',
      outputIndex: true,
      title: 'jsxstyle + preact',
    },
  ],
  // 'uglify',
  {
    output: {
      path: path.resolve(__dirname, '..', '..', 'build', 'preact'),
      publicPath: '',
    },
  },
]);
