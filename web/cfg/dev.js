const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const base = require('./base')

// // vendor packages so we can create a separate bundle
// const vendor = [
//   'classnames',
//   'core-js',
//   'email-validator',
//   'global',
//   'history',
//   'http-client',
//   'immutable',
//   'intl',
//   'invariant',
//   'jwt-decode',
//   'keycode',
//   'piwik-react-router',
//   'raven-js',
//   'react',
//   'react-display-name',
//   'react-dom',
//   'react-google-maps',
//   'react-helmet',
//   'react-intl',
//   'react-loadable',
//   'react-redux',
//   'react-router',
//   'react-router-dom',
//   'recompose',
//   'redux',
//   'redux-form/immutable',
//   'redux-idle-monitor',
//   'redux-immutable',
//   'redux-thunk',
//   'whatwg-fetch',
// ]

const config = () => {
  process.env.ASPECT_TARGET = 'local'
  process.env.NODE_ENV = 'development'
  process.env.BABEL_ENV = 'webpack'

  return {
    mode: 'development',
    // entry: [],
    devtool: 'eval-cheap-module-source-map',
    optimization: {
      // moduleIds: 'named',
      runtimeChunk: 'single',
      usedExports: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // defaultVendors: {},
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-helmet)[\\/]/,
            name: 'vendor-react',
            chunks: 'all',
          },
          react_table: {
            test: /[\\/]node_modules[\\/](react-table)[\\/]/,
            name: 'vendor-react-table',
            chunks: 'all',
          },
          react_intl: {
            test: /[\\/]node_modules[\\/](intl|react-intl)[\\/]/,
            name: 'vendor-intl',
            chunks: 'all',
          },
          redux: {
            test: /[\\/]node_modules[\\/](react-redux|redux|redux-thunk|redux-idle-monitor|redux-immutable)[\\/]/,
            name: 'vendor-redux',
            chunks: 'all',
          },
          rq: {
            test: /[\\/]node_modules[\\/](react-query)[\\/]/,
            name: 'vendor-react-query',
            chunks: 'all',
          },
          lodash: {
            test: /[\\/]node_modules[\\/](lodash)[\\/]/,
            name: 'vendor-lodash',
            chunks: 'all',
          },
          nivo: {
            test: /[\\/]node_modules[\\/]@nivo/,
            name: 'vendor-nivo',
            chunks: 'all',
          },
          mui: {
            test: /[\\/]node_modules[\\/]@material-ui/,
            name: 'vendor-material-ui',
            chunks: 'all',
          },
          dates: {
            test: /[\\/]node_modules[\\/](date-fns|date-fns-timezone)[\\/]/,
            name: 'vendor-date-fns',
            chunks: 'all',
          },
          formik: {
            test: /[\\/]node_modules[\\/](formik)[\\/]/,
            name: 'vendor-formik',
            chunks: 'all',
          },
        },
      },
    },
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
