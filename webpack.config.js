const path = require('path');
const webpack = require('webpack');

const webPackConfig = {
  entry: {
    'apollo-link-timeout': './src/index.ts'
  },
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd' // AMD + CommonJS
  },
  externals: [], // Dont bundle these libs
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.json', '.ts', '.tsx']
  }
};

module.exports = webPackConfig;
