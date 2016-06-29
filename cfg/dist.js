'use strict';

let path = require('path');
let webpack = require('webpack');

let baseConfig = require('./base');
let defaultSettings = require('./defaults');

// Add needed plugins here
let BowerWebpackPlugin = require('bower-webpack-plugin');
let ManifestPlugin = require('webpack-manifest-plugin');
let ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');

// vendor packages so we can create a separate bundle
const vendorPackages = [
  'immutable', 'isomorphic-fetch',
  'jwt-decode', 'material-ui', 'moment', 'react',
  'react-addons-pure-render-mixin', 'react-dom',
  'react-redux', 'react-router', 'react-router-scroll',
  'react-sparklines', 'react-tap-event-plugin',
  'redux', 'redux-history-transitions', 'redux-immutable',
  'redux-thunk'
]

let config = Object.assign({}, baseConfig, {
  entry: {
    app: path.join(__dirname, '../src/index'),
    vendor: vendorPackages
  },
  output: {
    path: path.join(__dirname, '/../dist/assets'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[chunkhash].js',
    publicPath: `.${defaultSettings.publicPath}`
  },
  cache: false,
  devtool: 'sourcemap',
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new BowerWebpackPlugin({
      searchResolveModulesDirectories: false
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.NoErrorsPlugin(),


    new webpack.optimize.CommonsChunkPlugin( { names: ["vendor", "manifest"] }),
    new ManifestPlugin(),
    new ChunkManifestPlugin({
      filename: "chunk-manifest.json",
      manifestVariable: "webpackManifest"
    }),
    new webpack.optimize.OccurenceOrderPlugin()
  ],
  module: defaultSettings.getDefaultModules()
});

// Add needed loaders to the defaults here
config.module.loaders.push({
  test: /\.(js|jsx)$/,
  loader: 'babel',
  include: [].concat(
    config.additionalPaths, [path.join(__dirname, '/../src')]
  )
});

module.exports = config;
