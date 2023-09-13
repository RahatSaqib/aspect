const path = require('path')
const Dotenv = require('dotenv-webpack')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const base = require('./base')

const config = () => {
  process.env.ASPECT_TARGET = 'local'
  process.env.NODE_ENV = 'development'
  process.env.BABEL_ENV = 'webpack'

  const config = {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    output: {
      filename: '[name].js',
    },
    devServer: {
      contentBase: path.join(__dirname, '../dist'),
      historyApiFallback: true,
      hot: true,
      port: 8000,
      noInfo: false,
    },
    optimization: {
      /**
       * see all Optimization options -
       * https://webpack.js.org/configuration/optimization/
       */
      moduleIds: 'named',
      chunkIds: 'named',
      minimize: false,
      runtimeChunk: 'single',
      usedExports: true,
    },
    plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),
      new Dotenv({
        path: './.env.development',
        allowEmptyValues: true,
        prefix: 'process.env.',
      }),
    ],
  }

  return merge(base(process.env.NODE_ENV), config)
}

module.exports = config()
