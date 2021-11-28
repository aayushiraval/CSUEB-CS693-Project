const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      API_HOST: JSON.stringify('http://localhost:8080'),
      ENV_NAME: JSON.stringify('local')
    })
  ],
  devServer: {
    contentBase: './src',
    hot: true,
    historyApiFallback: true,
    port: 3000,
  }
});
