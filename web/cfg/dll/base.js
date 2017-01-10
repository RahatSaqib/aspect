import fs from 'fs'
import path from 'path'
import webpack from 'webpack'

import HtmlWebpackPlugin from 'html-webpack-plugin'

// We include lodash modules independently since we're using 'babel-plugin-lodash'
const lodashModularPackages = fs.readdirSync(path.join(__dirname, '../../node_modules/lodash'))
  .filter(it => !it.startsWith('_') && it.endsWith('.js') && it.substr(0, 6) !== 'lodash')
  .map(it => `lodash/${it}`)

// vendor packages so we can create a separate bundle
const vendor = [
  ...lodashModularPackages,
  'classnames',
  'core-js/shim',
  'date-fns',
  'dom-helpers',
  'email-validator',
  'global',
  'http-client',
  'immutable',
  'intl',
  'invariant',
  'jwt-decode',
  'keycode',
  'material-ui',
  'piwik-react-router',
  'raven-js',
  'react',
  'react-display-name',
  'react-dom',
  'react-google-maps',
  'react-helmet',
  'react-intl',
  'react-redux',
  'react-router',
  'react-router-scroll',
  'react-sparklines',
  'react-tap-event-plugin',
  'recompose',
  'redux',
  'redux-form',
  'redux-idle-monitor',
  'redux-immutable',
  'redux-thunk',
  'whatwg-fetch'
]

export default {
  entry: {
    vendor
  },
  output: {
    path: path.join(__dirname, '../../dist/assets'),
    filename: 'dll.[name].js',
    library: '[name]'
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, '../../src/template', 'dll.[name].manifest.json'),
      name: '[name]',
      context: path.resolve(__dirname, '../../src')
    }),

    new HtmlWebpackPlugin({
      // We use HtmlWebpackPlugin here to compile `index.ejs` into `index.html`
      // with webpack.hash injected for DLL asset URL.
      inject: false,
      template: 'src/template/index.ejs',
      filename: '../../src/template/index.html'
    }),
  ]
}
