const webpack = require('webpack')
const merge = require('webpack-merge')
const base = require('./base')
const CompressionPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const config = () => {
  process.env.ASPECT_TARGET = 'dist'
  process.env.NODE_ENV = 'production'
  process.env.BABEL_ENV = 'webpack'

  return {
    mode: 'production',
    output: {
      filename: '[name].[contenthash].js',
    },
    devtool: false,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        chunkFilename: '[id].[contenthash].css',
      }),
      new HtmlWebpackPlugin({
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
        },
      }),
      new webpack.NamedChunksPlugin(),
      new webpack.HashedModuleIdsPlugin(),
      new CompressionPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.(js|css)(\.map)?$/,
        threshold: 10240,
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-report.html',
        openAnalyzer: true,
      }),
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
      },
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            mangle: false,
            beautify: false,
            comments: false,
            toplevel: false,
            sourceMap: true,
            cache: true,
            keep_classnames: true,
            keep_fnames: true,
            compress: {
              drop_console: true,
            },
          },
          sourceMap: false,
          cache: true,
          parallel: true,
        }),
        new OptimizeCSSAssetsPlugin(),
      ],
    },
  }
}

module.exports = merge.smart(base, config())
