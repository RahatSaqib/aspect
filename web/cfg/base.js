const path = require('path')
// const assign = require('lodash/assign')
const webpack = require('webpack')
const pxToRem = require('postcss-pxtorem')
const cssImport = require('postcss-import')
const cssNext = require('postcss-cssnext')
const DelWebpackPlugin = require('del-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const SpriteLoaderPlugin = require('svg-sprite-loader/plugin')
const WebpackPwaManifest = require('webpack-pwa-manifest')
// const { WebpackManifestPlugin } = require('webpack-manifest-plugin')
// const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const postcssPresetEnv = require('postcss-preset-env')

const {
  definePluginVariables,
  customPropertiesVariables,
} = require('./variables')

const postcssPlugins = () => [
  pxToRem({
    /* see options: https://github.com/cuth/postcss-pxtorem#options */
    rootValue: 16,
  }),
  cssImport(),
  postcssPresetEnv({
    /* see https://www.npmjs.com/package/postcss-preset-env */
    browsers: ['> 1%', 'last 2 versions'],
    // importFrom: {
    //   customProperties: customPropertiesVariables,
    // },
    // exportTo: 'custom-properties.css',
  }),
  cssNext({
    // browsers: ['> 1%', 'last 2 versions'],
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
          process.env.NODE_ENV === 'development'
            ? 'style-loader'
            : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]--[local]--[hash:base64:8]',
                exportLocalsConvention: 'camelCase',
              },
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: postcssPlugins(),
              },
            },
          },
        ],
      },
      {
        // images
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset',
      },
      {
        // fonts
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset',
      },
      {
        // video
        test: /\.(mp4|ogg)$/i,
        type: 'asset',
      },
    ],
  },
  plugins: [
    new DelWebpackPlugin({
      info: false,
    }),
    new webpack.DefinePlugin(definePluginVariables),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      /*
       * this prop is added by 'html-webpack-harddisk-plugin'
       * see see https://github.com/jantimon/html-webpack-harddisk-plugin
       */
      alwaysWriteToDisk: true,
      /*
       * see options - https://github.com/jantimon/html-webpack-plugin#options
       */
      inject: true,
      template: 'src/template/index.html',
      filename: 'index.html',
      favicon: path.join(__dirname, '../src/template/favicon.png'),
    }),
    // new SpriteLoaderPlugin(),
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
