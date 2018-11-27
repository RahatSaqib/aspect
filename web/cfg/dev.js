const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const base = require('./base')
const AutoDllPlugin = require('autodll-webpack-plugin')

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

const config = () => {
  process.env.ASPECT_TARGET = 'local'
  process.env.NODE_ENV = 'development'
  process.env.BABEL_ENV = 'webpack'

  return {
    mode: 'development',
    entry: [
      'core-js/es6/symbol',
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://localhost:8000',
      'webpack/hot/only-dev-server',
    ],
    devtool: 'cheap-module-eval-source-map',
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: false,
              },
            },
          ],
        },
      ],
    },
    devServer: {
      contentBase: path.join(__dirname, '../dist'),
      historyApiFallback: true,
      hot: true,
      port: 8000,
      publicPath: '/assets/',
      noInfo: false,
    },
    plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new AutoDllPlugin({
        inject: true,
        debug: true,
        filename: '[name]_[hash].js',
        path: './dll',
        entry: {
          vendor,
        },
      }),
    ],
  }
}

module.exports = merge.smart(base, config())
