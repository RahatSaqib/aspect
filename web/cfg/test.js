import path from 'path'
// Add needed plugins here
import BowerWebpackPlugin from 'bower-webpack-plugin'

import defaultSettings from './defaults'
import baseConfig from './base'

export default {
  devtool: 'eval',
  module: {
    preLoaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'isparta-instrumenter-loader',
        include: [
          path.join(__dirname, '/../src')
        ]
      }
    ],
    loaders: [
      {
        test: /\.(ico|png|jpg|gif|woff|woff2|css|sass|scss|less|styl)$/,
        loader: 'null-loader'
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        include: [].concat(
          baseConfig.additionalPaths,
          [
            path.join(__dirname, '/../src')
          ]
        )
      }
    ]
  },
  resolve: {
    extensions: [ '', '.js', '.jsx' ]
  },
  externals: {
    'jsdom': 'window',
    'cheerio': 'window',
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': true,
    'react/addons': true
  },
  plugins: [
    new BowerWebpackPlugin({
      searchResolveModulesDirectories: false
    })
  ]
}
