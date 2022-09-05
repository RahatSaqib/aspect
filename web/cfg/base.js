const path = require('path')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const cssNext = require('postcss-cssnext')
const cssImport = require('postcss-import')
const pxToRem = require('postcss-pxtorem')
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin')
const webpack = require('webpack')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')
const { definePluginVariables, customPropertiesVariables } = require('./variables')

const postcssPlugins = () => [
  pxToRem({
    /* see options: https://github.com/cuth/postcss-pxtorem#options */
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

module.exports = NODE_ENV => {
  return {
    entry: ['./src/index'],
    output: {
      path: path.join(__dirname, '../dist'),
      publicPath: '/',
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
            NODE_ENV === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader,
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
          test: /\.(png|jpg|gif|woff|woff2)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
                esModule: false,
              },
            },
          ],
          type: 'javascript/auto',
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
          type: 'javascript/auto',
        },
        {
          test: /\.(mp4|ogg|svg)$/,
          exclude: path.resolve(__dirname, '../src'),
          use: ['file-loader'],
          type: 'javascript/auto',
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: false,
              },
            },
          ],
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin(definePluginVariables),
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
        template: 'src/index.html',
        filename: 'index.html',
        favicon: path.join(__dirname, '../src/assets/favicon.png'),
      }),
      new SpriteLoaderPlugin(),
      new WebpackManifestPlugin(),
      new HtmlWebpackHarddiskPlugin({
        outputPath: path.join(__dirname, '../dist'),
      }),
    ],
  }
}
