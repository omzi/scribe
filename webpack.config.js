const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './frontend/main.js',
  output: {
    filename: 'main.bundle.js',
    path: path.resolve(__dirname, 'src', 'public', 'js')
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
