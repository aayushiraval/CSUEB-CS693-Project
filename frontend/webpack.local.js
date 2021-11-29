const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      API_HOST: JSON.stringify('https://a837b00f7ed324e3e82c6465ecfb274a-644369061.us-east-1.elb.amazonaws.com:8080'),
      ENV_NAME: JSON.stringify('local')
    })
  ],
  devServer: {
    https: true,
    contentBase: './src',
    hot: true,
    disableHostCheck: true,
    historyApiFallback: true,
    port: 3000,
  }
});
