import path from 'path'
import webpack from 'webpack'

import baseConfig from './base'

export default {
  ...baseConfig,
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
  output: {
    ...baseConfig.output,
    pathinfo: true
  },
  module: {
    ...baseConfig.module,
    rules: [
      ...baseConfig.module.rules,
      {
        test: /\.(ico)$/,
        use: [
          'null-loader'
        ]
      }
    ]
  },
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.ASPECT_ENV': '"dev"'
    }),
    new webpack.LoaderOptionsPlugin({
      debug: true
    }),
  ]
}
