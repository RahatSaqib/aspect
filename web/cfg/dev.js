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
    devtool: 'eval-cheap-module-source-map',
    devServer: {
      contentBase: path.join(__dirname, '../dist'),
      historyApiFallback: true,
      hot: true,
      port: 8000,
      publicPath: '/assets/',
      noInfo: false,
    },
    plugins: [new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET'])],
  }
}

module.exports = merge(base, config())
