import path from 'path'

import defaultSettings from './defaults'

// Additional npm or bower modules to include in builds
// Add all foreign plugins you may need into this array
// @example:
// const npmBase = path.join(__dirname, '../node_modules')
// const additionalPaths = [ path.join(npmBase, 'react-bootstrap') ]
const additionalPaths = []

export default {
  additionalPaths,
  port: defaultSettings.port,
  debug: true,
  devtool: 'eval',
  output: {
    path: path.join(__dirname, '/../dist/assets'),
    filename: 'app.js',
    publicPath: defaultSettings.publicPath
  },
  devServer: {
    contentBase: './src/',
    historyApiFallback: true,
    hot: true,
    port: defaultSettings.port,
    publicPath: defaultSettings.publicPath,
    noInfo: false
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {},
  postcss: defaultSettings.postcss
}
