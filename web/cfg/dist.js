const webpack = require('webpack')
const path = require('path')
const merge = require('webpack-merge')
const base = require('./base')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
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
      new webpack.NamedChunksPlugin(),
      new webpack.HashedModuleIdsPlugin(),
      new CompressionPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.(js|css)(\.map)?$/,
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
      minimize: true,
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        minSize: 30000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        name: true,
        cacheGroups: {
          vendor: {
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
          },
          main: {
            chunks: 'all',
            minChunks: 2,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
      minimizer: [
        new UglifyJsPlugin(),
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.css$/g,
          cssProcessorOptions: {
            safe: true,
            autoprefixer: { disable: true },
            mergeLonghand: false,
            discardComments: {
              removeAll: true,
            },
          },
          canPrint: true,
        }),
      ],
    },
  }
}

module.exports = merge.smart(base, config())
