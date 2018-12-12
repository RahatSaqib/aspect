const path = require('path')
const _ = require('lodash')
const webpack = require('webpack')
const pxToRem = require('postcss-pxtorem')
const cssImport = require('postcss-import')
const cssNext = require('postcss-cssnext')
const DelWebpackPlugin = require('del-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin')
const WebpackPwaManifest = require('webpack-pwa-manifest')

const {
  definePluginVariables,
  customPropertiesVariables,
} = require('./variables')

const postcssPlugins = () => [
  pxToRem({
    // See available options: https://github.com/cuth/postcss-pxtorem#options
    rootValue: 16,
  }),
  cssImport(),
  cssNext({
    browsers: ['> 1%', 'last 2 versions'],
    features: {
      customProperties: {
        variables: customPropertiesVariables,
      },
    },
  }),
]

module.exports = {
  entry: ['./src/index'],
  output: {
    pathinfo: process.env.NODE_ENV === 'development',
    path: path.join(__dirname, '../dist/assets'),
    filename: '[name].js',
    publicPath: '/assets/',
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[name]--[local]--[hash:base64:8]',
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              sourceMap: 'inline',
              plugins: postcssPlugins,
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        include: path.resolve(__dirname, '../src'),
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              extract: true,
            },
          },
        ],
      },
      {
        test: /\.(mp4|ogg|svg)$/,
        exclude: path.resolve(__dirname, '../src'),
        use: ['file-loader'],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              interpolate: true,
              minimize: false,
              removeComments: false,
              collapseWhitespace: false,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new DelWebpackPlugin({
      info: false,
    }),
    new webpack.DefinePlugin(_.assign({}, definePluginVariables)),
    new HtmlWebpackPlugin({
      inject: true,
      alwaysWriteToDisk: true,
      template: 'src/template/index.html',
      filename: 'index.html',
      favicon: path.join(__dirname, '../src/template/favicon.png'),
    }),
    new SpriteLoaderPlugin(),
    new FaviconsWebpackPlugin({
      logo: path.join(__dirname, '../src/template/favicon.png'),
      prefix: 'icons-[hash]-',
      persistentCache: false,
      inject: true,
      background: '#fff',
      // which icons should be generated (see https://github.com/haydenbleasel/favicons#usage)
      icons: {
        android: true,
        appleIcon: true,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: true,
        opengraph: false,
        twitter: false,
        yandex: false,
        windows: false,
      },
    }),
    new WebpackPwaManifest({
      icons: [
        {
          src: path.join(__dirname, '../src/template/favicon.png'),
          sizes: [96, 128, 192],
        },
      ],
      name: 'Aspect',
      short_name: 'Aspect',
      start_url: '/login',
      display: 'standalone',
      background_color: '#eceff6',
      description:
        'Aspect is a data management platform that handles diagnostic data produced by medical devices in the field.',
    }),
    new HtmlWebpackHarddiskPlugin({
      outputPath: path.join(__dirname, '../dist'),
    }),
  ],
}
