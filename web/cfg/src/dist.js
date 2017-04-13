import path from 'path'
import webpack from 'webpack'
// Add needed plugins here
import ManifestPlugin from 'webpack-manifest-plugin'
import ChunkManifestPlugin from 'chunk-manifest-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import HtmlWebpackPluginRemove from 'html-webpack-plugin-remove'

import baseConfig from './base'

export default {
  ...baseConfig,
  cache: false,
  devtool: 'sourcemap',
  module: {
    ...baseConfig.module,
    rules: [
      ...baseConfig.module.rules,
      {
        test: /\.(ico)$/,
        use: [
          'static-loader'
        ]
      }
    ]
  },
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      'process.env.ASPECT_ENV': '"dist"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),

    new ManifestPlugin(),
    new ChunkManifestPlugin({
      filename: 'chunk-manifest.json',
      manifestVariable: 'webpackManifest'
    }),

    new HtmlWebpackPlugin({
      hash: true,
      template: 'src/template/index.html',
      filename: '../index.html'
    }),
    new HtmlWebpackPluginRemove(/<script type="text\/javascript" src="\/assets\/\S+\.js"><\/script>/g)
  ]
}
