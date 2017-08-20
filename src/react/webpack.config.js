const path = require('path');

module.exports = require('wub')([
  [
    'react',
    {
      rootComponent: './app.js',
      outputIndex: true,
      title: 'jsxstyle + react',
    },
  ],
  // 'uglify',
  {
    output: {
      path: path.resolve(__dirname, '..', '..', 'build', 'react'),
      publicPath: '',
    },
  },
]);
