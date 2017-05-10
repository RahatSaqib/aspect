import path from 'path'
import invariant from 'invariant'
import webpack from 'webpack'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'

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
  'react-sparklines',
  'react-tap-event-plugin',
  'recompose',
  'redux',
  'redux-form/immutable',
  'redux-idle-monitor',
  'redux-immutable',
  'redux-thunk',
  'whatwg-fetch'
]

export default (env) => {
  switch (env.ASPECT_TARGET) {
    case 'local': {
      process.env.ASPECT_TARGET = 'local'
      process.env.NODE_ENV = 'development'
      process.env.BABEL_ENV = 'development'
      break
    }
    case 'dist': {
      process.env.ASPECT_TARGET = 'dist'
      process.env.NODE_ENV = 'production'
      process.env.BABEL_ENV = 'production'
      break
    }
    default:
      invariant(false, `Incorrect --env.ASPECT_TARGET=${env.ASPECT_TARGET}`)
  }
  // build flags for webpack
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    entry: {
      vendor
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    output: {
      pathinfo: isDevelopment,
      path: path.join(__dirname, '../dist/assets'),
      filename: 'dll.[name].js',
      library: '[name]'
    },
    plugins: [
      new webpack.DllPlugin({
        path: path.join(__dirname, '../src/template', 'dll.[name].manifest.json'),
        name: '[name]',
        context: path.resolve(__dirname, '../src')
      }),

      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),

      new HtmlWebpackPlugin({
        // We use HtmlWebpackPlugin here to compile `index.ejs` into `index.html`
        // with webpack.hash injected for DLL asset URL.
        inject: false,
        template: 'src/template/index.ejs',
        filename: path.resolve(__dirname, '../src/template/index.html')
      }),
      new CompressionPlugin({
        asset: '[path].gz[query]',
        test: /\.(js|css)(\.map)?$/,
        threshold: 10240,
      }),
    ].concat(isProduction ? [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true
      }),
    ]: [])
  }
}
