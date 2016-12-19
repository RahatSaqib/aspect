import path from 'path'
import webpack from 'webpack'

import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin'

export default {
  entry: './src/index',
  output: {
    path: path.join(__dirname, '../../dist/assets'),
    filename: '[name].js',
    publicPath: '/assets/',
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    // preLoaders: [{
    //   test: /\.(js|jsx)$/,
    //   include: srcPath,
    //   loader: 'eslint-loader'
    // }],
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        include: [
          path.join(__dirname, '../../src')
        ]
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader?modules!postcss-loader'
      },
      {
        test: /\.sass/,
        loader: 'style-loader!css-loader!postcss-loader!sass-loader?outputStyle=expanded&indentedSyntax'
      },
      {
        test: /\.scss/,
        loader: 'style-loader!css-loader!postcss-loader!sass-loader?outputStyle=expanded'
      },
      {
        test: /\.less/,
        loader: 'style-loader!css-loader!postcss-loader!less-loader'
      },
      {
        test: /\.styl/,
        loader: 'style-loader!css-loader!postcss-loader!stylus-loader'
      },
      {
        test: /\.(png|jpg|gif|woff|woff2)$/,
        loader: 'url-loader?limit=8192'
      },
      {
        test: /\.(mp4|ogg|svg)$/,
        loader: 'file-loader'
      }
    ]
  },
  plugins: [
    new webpack.DllReferencePlugin({
      context: path.join(__dirname, '../../src'),
      manifest: require('../../src/template/dll.vendor.manifest.json')
    }),
    new webpack.NoErrorsPlugin(),
    new CaseSensitivePathsPlugin()
  ],
  postcss() {
    return []
  }
}
