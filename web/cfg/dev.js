import path from 'path'
import webpack from 'webpack'
// Add needed plugins here
import BowerWebpackPlugin from 'bower-webpack-plugin'

import defaultSettings from './defaults'
import baseConfig from './base'

const config = Object.assign({}, baseConfig, {
  entry: [
    'whatwg-fetch',
    './src/index'
  ],
  cache: true,
  devtool: 'inline-source-map',
  plugins: [
    new webpack.NoErrorsPlugin(),
    new BowerWebpackPlugin({
      searchResolveModulesDirectories: false
    })
  ],
  module: defaultSettings.getDefaultModules()
})

// Add needed loaders to the defaults here
config.module.loaders.push({
  test: /\.(js|jsx)$/,
  loader: 'babel-loader',
  include: [].concat(
    config.additionalPaths,
    [ path.join(__dirname, '/../src') ]
  )
})

config.module.loaders.push({
  test: /\.(ico)$/,
  loader: 'null-loader'
})

export default config
