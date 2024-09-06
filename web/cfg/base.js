const path = require('path')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')

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
          test: /\.modules\.css$/,
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
          ],
        },
        {
          test: /\.css$/,
          exclude: /\.modules\.css$/,
          use: [NODE_ENV === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
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
