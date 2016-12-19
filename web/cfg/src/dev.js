import path from 'path'
import webpack from 'webpack'

import baseConfig from './base'

export default {
  ...baseConfig,
  debug: true,
  cache: true,
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, '../../dist'),
    historyApiFallback: true,
    hot: true,
    port: 8000,
    publicPath: baseConfig.publicPath,
    noInfo: false
  },
  module: {
    ...baseConfig.module,
    loaders: [
      ...baseConfig.module.loaders,
      {
        test: /\.(ico)$/,
        loader: 'null-loader'
      }
    ]
  },
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.ASPECT_ENV': '"dev"'
    })
  ]
}
