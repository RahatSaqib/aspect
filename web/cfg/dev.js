const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const base = require('./base')

const config = () => {
  process.env.ASPECT_TARGET = 'local'
  process.env.NODE_ENV = 'development'
  process.env.BABEL_ENV = 'webpack'

  return {
    mode: 'development',
    // entry: [],
    devtool: 'eval-cheap-module-source-map',
    devServer: {
      // contentBase: path.join(__dirname, 'assets'),
      contentBase: path.join(__dirname, '../dist'),
      historyApiFallback: true,
      hot: true,
      port: 8000,
      publicPath: '/assets/',
      noInfo: false,
    },
    plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),
      // new AutoDllPlugin({
      //   inject: true,
      //   debug: true,
      //   filename: '[name]_dll.js',
      //   path: './',
      //   entry: {
      //     vendor,
      //   },
      // }),
      // new webpack.NamedModulesPlugin(),
    ],
  }
}

module.exports = merge(base, config())
