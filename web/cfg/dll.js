const path = require('path')
const fs = require('fs')
const promisify = require('util.promisify')
const _ = require('lodash')
const webpack = require('webpack')
const CompressionPlugin = require('compression-webpack-plugin')

const stat = promisify(fs.stat)

const mTimeOf = file =>
  stat(path.resolve(__dirname, file)).then(({ mtime }) => mtime, () => 0)

// vendor packages so we can create a separate bundle
const vendor = [
  'classnames',
  'core-js/shim',
  'dom-helpers',
  'email-validator',
  'global',
  'history',
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
  'react-loadable',
  'react-redux',
  'react-router',
  'react-router-dom',
  'react-tap-event-plugin',
  'recompose',
  'redux',
  'redux-form/immutable',
  'redux-idle-monitor',
  'redux-immutable',
  'redux-thunk',
  'whatwg-fetch',
]

module.exports = () => {
  process.env.NODE_ENV = 'production'
  process.env.BABEL_ENV = 'webpack'

  return Promise.all([
    mTimeOf('../dist/assets/dll.vendor.js'),
    mTimeOf('../yarn.lock'),
    mTimeOf(__filename),
  ]).then(([dllMtime, ...dependencies]) => {
    if (dllMtime > _.max(dependencies)) {
      process.exit(0)
      return
    }
    return {
      entry: {
        vendor,
      },
      devtool: 'source-map',
      output: {
        path: path.join(__dirname, '../dist/assets'),
        filename: 'dll.[name].js',
        library: '[name]',
      },
      plugins: [
        new webpack.DllPlugin({
          path: path.join(
            __dirname,
            '../src/template',
            'dll.[name].manifest.json'
          ),
          name: '[name]',
          context: path.resolve(__dirname, '../src'),
        }),
        new webpack.EnvironmentPlugin(['NODE_ENV']),
        new webpack.NoEmitOnErrorsPlugin(),
        new CompressionPlugin({
          filename: '[path].gz[query]',
          test: /\.(js|css)(\.map)?$/,
          threshold: 10240,
        }),
      ],
    }
  })
}
