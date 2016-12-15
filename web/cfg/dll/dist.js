import webpack from 'webpack'

import baseConfig from './base'

export default {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      'process.env.ASPECT_ENV': '"dev"'
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
}

