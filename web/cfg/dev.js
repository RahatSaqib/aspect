const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const base = require('./base')

const config = () => {
  process.env.ASPECT_TARGET = 'local'
  process.env.NODE_ENV = 'development'
  process.env.BABEL_ENV = 'webpack'

  return {
    mode: 'development',
    entry: [
      'core-js/es6/symbol',
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://localhost:8000',
      'webpack/hot/only-dev-server',
    ],
    devtool: 'cheap-module-eval-source-map',
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: false,
              },
            },
          ],
        },
      ],
    },
    devServer: {
      contentBase: path.join(__dirname, '../dist'),
      historyApiFallback: true,
      hot: true,
      port: 8000,
      publicPath: '/assets/',
      noInfo: false,
    },
    plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin(),
    ],
  }
}

module.exports = merge.smart(base, config())
