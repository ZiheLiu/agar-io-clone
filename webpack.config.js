const path = require('path');

module.exports = {
  entry: {
    client: path.resolve(__dirname, './public/javascripts/src/client.js'),
    config: path.resolve(__dirname, './public/javascripts/src/config.js'),
    utils: path.resolve(__dirname, './public/javascripts/src/utils.js'),
    canvas:  path.resolve(__dirname, './public/javascripts/src/canvas.js')
  },
  output: {
    path: path.resolve(__dirname,'./public/javascripts/bin'),
    filename: '[name].js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  }
};

