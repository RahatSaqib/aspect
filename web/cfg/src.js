const path = require('path')
const invariant = require('invariant')
const _ = require('lodash')
const webpack = require('webpack')
const pxToRem = require('postcss-pxtorem')
const cssImport = require('postcss-import')
const cssNext = require('postcss-cssnext')
const DelWebpackPlugin = require('del-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const {
  default: WebappManifestPlugin,
  FAVICON_PLUGIN,
} = require('webapp-manifest-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const {
  customPropertiesVariables,
  definePluginVariables,
} = require('./variables')

const postcssPlugins = () => [
  pxToRem({
    // See available options: https://github.com/cuth/postcss-pxtorem#options
    rootValue: 16,
  }),
  cssImport(),
  cssNext({
    browsers: ['> 1%', 'last 2 versions'],
    features: {
      customProperties: {
        variables: customPropertiesVariables,
      },
    },
  }),
]

module.exports = env => {
  switch (env.ASPECT_TARGET) {
    case 'local': {
      process.env.ASPECT_TARGET = 'local'
      process.env.NODE_ENV = 'development'
      process.env.BABEL_ENV = 'webpack'
      break
    }
    case 'dist': {
      process.env.ASPECT_TARGET = 'dist'
      process.env.NODE_ENV = 'production'
      process.env.BABEL_ENV = 'webpack'
      break
    }
    default:
      invariant(false, `Incorrect --env.ASPECT_TARGET=${env.ASPECT_TARGET}`)
  }
  // build flags for webpack
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  const extractCSS = new ExtractTextPlugin({
    disable: isDevelopment,
    filename: '[name]-css-modules.css',
  })

  return {
    entry: []
      .concat(
        isDevelopment
          ? [
              'core-js/es6/symbol',
              'react-hot-loader/patch',
              'webpack-dev-server/client?http://localhost:8000',
              'webpack/hot/only-dev-server',
            ]
          : []
      )
      .concat(['./src/index']),
    cache: isDevelopment,
    devServer: isDevelopment
      ? {
          contentBase: path.join(__dirname, '../dist'),
          historyApiFallback: true,
          hot: true,
          port: 8000,
          publicPath: '/assets/',
          noInfo: false,
        }
      : {},
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    output: {
      pathinfo: isDevelopment,
      path: path.join(__dirname, '../dist/assets'),
      filename: '[name].js',
      chunkFilename: '[chunkhash].chunk.js',
      publicPath: '/assets/',
    },
    resolve: {
      extensions: ['.json', '.js', '.jsx'],
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
          use: ['babel-loader'],
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
                  localIdentName: '[name]--[local]--[hash:base64:8]',
                  importLoaders: 1,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  sourceMap: 'inline',
                  plugins: postcssPlugins,
                },
              },
            ],
          }),
        },
        {
          test: /\.(png|jpg|gif|woff|woff2)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
              },
            },
          ],
        },
        {
          test: /\.(mp4|ogg|svg)$/,
          use: ['file-loader'],
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {
                interpolate: true,
                minimize: false,
                removeComments: false,
                collapseWhitespace: false,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new webpack.DllReferencePlugin({
        context: path.join(__dirname, '../src'),
        manifest: require('../src/template/dll.vendor.manifest.json'),
      }),

      new webpack.LoaderOptionsPlugin({
        debug: isDevelopment,
        minimize: isProduction,
      }),
      new webpack.EnvironmentPlugin(['NODE_ENV', 'ASPECT_TARGET']),
      new webpack.DefinePlugin(_.assign({}, definePluginVariables)),

      new DelWebpackPlugin({
        exclude: [
          'dll.vendor.js',
          'dll.vendor.js.gz',
          'dll.vendor.js.map',
          'dll.vendor.js.map.gz',
        ],
      }),
      extractCSS,
      new FaviconsWebpackPlugin({
        logo: path.join(__dirname, '../src/template/favicon.png'),
        prefix: 'icons-[hash]-',
        persistentCache: true,
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
      new WebappManifestPlugin({
        icons: FAVICON_PLUGIN,
        name: 'Aspect',
        short_name: 'Aspect',
        start_url: '/login',
        display: 'standalone',
        background_color: '#eceff6',
        description:
          'Aspect is a data management platform that handles diagnostic data produced by medical devices in the field.',
      }),
      new HtmlWebpackPlugin({
        inject: true,
        hash: isProduction,
        alwaysWriteToDisk: true,
        template: 'src/template/index.html',
        filename: 'index.html',
      }),
      new HtmlWebpackIncludeAssetsPlugin({
        hash: isProduction,
        append: false,
        assets: ['dll.vendor.js'],
      }),
      new HtmlWebpackHarddiskPlugin({
        outputPath: path.join(__dirname, '../dist'),
      }),
    ].concat(
      isProduction
        ? [
            new webpack.NoEmitOnErrorsPlugin(),
            new webpack.optimize.UglifyJsPlugin({
              sourceMap: true,
            }),
            new webpack.optimize.AggressiveMergingPlugin(),
            new CaseSensitivePathsPlugin(),
            new CompressionPlugin({
              asset: '[path].gz[query]',
              test: /\.(js|css)(\.map)?$/,
              threshold: 10240,
            }),
          ]
        : [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            new BundleAnalyzerPlugin({ openAnalyzer: false }),
          ]
    ),
  }
}
