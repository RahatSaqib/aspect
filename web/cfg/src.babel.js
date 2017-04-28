import path from 'path'
import invariant from 'invariant'
import webpack from 'webpack'
import pxToRem from 'postcss-pxtorem'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin'
import ManifestPlugin from 'webpack-manifest-plugin'
import ChunkManifestPlugin from 'chunk-manifest-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import HtmlWebpackPluginRemove from 'html-webpack-plugin-remove'

const postcssPlugins = () => ([
  pxToRem({
    // See available options: https://github.com/cuth/postcss-pxtorem#options
    rootValue: 16
  })
])

export default (env) => {
  switch (env.ASPECT_TARGET) {
    case 'local': {
      process.env.ASPECT_TARGET = 'local'
      process.env.NODE_ENV = 'development'
      process.env.BABEL_ENV = 'development'
      break
    }
    case 'dist': {
      process.env.ASPECT_TARGET = 'dist'
      process.env.NODE_ENV = 'production'
      process.env.BABEL_ENV = 'production'
      break
    }
    default:
      invariant(false, `Incorrect --env.ASPECT_TARGET=${env.ASPECT_TARGET}`)
  }
  // build flags for webpack
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  const extractSCSS = new ExtractTextPlugin({
    disable: isDevelopment,
    filename: '[name]-scss-global-style.css'
  })
  const extractCSS = new ExtractTextPlugin({
    disable: isDevelopment,
    filename: '[name]-css-modules.css'
  })

  return {
    entry: [
    ].concat(isDevelopment ? [
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://localhost:8000',
      'webpack/hot/only-dev-server',
    ] : []).concat([
      './src/index'
    ]),
    cache: isDevelopment,
    devServer: isDevelopment ? {
      contentBase: path.join(__dirname, '../dist'),
      historyApiFallback: true,
      hot: true,
      port: 8000,
      publicPath: '/assets/',
      noInfo: false
    } : {},
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    output: {
      pathinfo: isDevelopment,
      path: path.join(__dirname, '../dist/assets'),
      filename: '[name].js',
      chunkFilename: '[chunkhash].chunk.js',
      publicPath: '/assets/',
    },
    resolve: {
      extensions: ['.json', '.js', '.jsx']
    },
    module: {
      rules: [
        // {
        //   test: /\.(js|jsx)$/,
        //   enforce: 'pre',
        //   use: 'eslint-loader'
        // },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: [
            'babel-loader'
          ]
        },
        {
          test: /\.scss/,
          use: extractSCSS.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: isProduction,
                  importLoaders: 1
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  sourceMap: 'inline',
                  plugins: postcssPlugins
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: isProduction,
                  outputStyle: 'expanded'
                }
              }
            ]
          })
        },
        {
          test: /\.css$/,
          use: extractCSS.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: isProduction,
                  modules: true,
                  importLoaders: 1
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  sourceMap: 'inline',
                  plugins: postcssPlugins
                }
              }
            ]
          })
        },
        {
          test: /\.(ico)$/,
          use: [
            isProduction ? 'static-loader' : 'null-loader'
          ]
        },
        {
          test: /\.(png|jpg|gif|woff|woff2)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192
              }
            }
          ]
        },
        {
          test: /\.(mp4|ogg|svg)$/,
          use: [
            'file-loader'
          ]
        }
      ]
    },
    plugins: [
      new webpack.DllReferencePlugin({
        context: path.join(__dirname, '../src'),
        manifest: require('../src/template/dll.vendor.manifest.json')
      }),

      new webpack.LoaderOptionsPlugin({
        debug: isDevelopment,
        minimize: isProduction
      }),
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),

      new ManifestPlugin(),
      new ChunkManifestPlugin({
        filename: 'chunk-manifest.json',
        manifestVariable: 'webpackManifest'
      }),

      extractSCSS,
      extractCSS,
      new HtmlWebpackPlugin({
        hash: true,
        template: 'src/template/index.html',
        filename: '../index.html'
      }),
      new HtmlWebpackPluginRemove(/<script type="text\/javascript" src="\/assets\/\S+\.js"><\/script>/g)
    ].concat(isProduction ? [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true
      }),
      new webpack.optimize.AggressiveMergingPlugin(),
      new CaseSensitivePathsPlugin(),

    ]: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
    ])
  }
}
