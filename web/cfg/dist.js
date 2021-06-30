const webpack = require('webpack')
const { merge } = require('webpack-merge')
const base = require('./base')

const config = () => {
  process.env.ASPECT_TARGET = 'dist'
  process.env.NODE_ENV = 'production'
  process.env.BABEL_ENV = 'webpack'

  return {
    mode: 'production',
    output: {
      filename: '[name].[contenthash].js',
    },
    devtool: false,
    plugins: [new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET'])],
  }
}

module.exports = merge(base, config())
