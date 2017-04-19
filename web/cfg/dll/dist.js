import webpack from 'webpack'

import baseConfig from './base'

export default {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      'process.env.ASPECT_TARGET': '"dist"'
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ]
}

