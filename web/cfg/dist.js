const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { merge } = require('webpack-merge')
const base = require('./base')

/**
 * To check locally if production build is good:
 * 1. Install globally package `http-server`
 * 2. Prepare production build by running `yarn dist`
 * 3. in `dist` folder run `http-server --gzip` or `http-server --gzip -p XXXX`
 *    where XXXX is port number. Open browser for `localhost:XXXX` - site
 *    should work well if you have API running.
 */

const config = () => {
  process.env.ASPECT_TARGET = 'dist'
  process.env.NODE_ENV = 'production'
  process.env.BABEL_ENV = 'webpack'

  /**
   * see all Configuration options -
   * https://webpack.js.org/configuration
   */
  const config = {
    mode: 'production',
    output: {
      clean: true, // clean 'dist' folder before emitting bundle files
      filename: '[name].[contenthash].js',
    },
    devtool: false,
    plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),
      /**
       * extracts CSS into separate files
       * see https://webpack.js.org/plugins/mini-css-extract-plugin/
       */
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        chunkFilename: '[id].[contenthash].css',
      }),
      /**
       * generate `gz` files for all js/css files in bundle
       * see https://webpack.js.org/plugins/compression-webpack-plugin/
       */
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css)$/,
        threshold: 10240,
      }),
      new CaseSensitivePathsPlugin(),
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        openAnalyzer: false,
      }),
    ],
    optimization: {
      /**
       * see all Optimization options -
       * https://webpack.js.org/configuration/optimization/
       */
      moduleIds: 'deterministic',
      chunkIds: 'named',
      minimize: true,
      runtimeChunk: 'single',
      usedExports: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            reuseExistingChunk: true,
          },
          main: {
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      },
      minimizer: [
        /**
         * minify JS -
         * https://webpack.js.org/plugins/terser-webpack-plugin/
         */
        new TerserPlugin(),
        /**
         * optimize and minify CSS
         * see https://webpack.js.org/plugins/css-minimizer-webpack-plugin/
         */
        new CssMinimizerPlugin({
          test: /\.css$/g,
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }),
      ],
    },
  }

  return merge(base(process.env.NODE_ENV), config)
}

module.exports = config()
