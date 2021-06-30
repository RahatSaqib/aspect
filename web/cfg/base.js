const path = require('path')
const webpack = require('webpack')
const pxToRem = require('postcss-pxtorem')
const cssImport = require('postcss-import')
const cssNext = require('postcss-cssnext')
const DelWebpackPlugin = require('del-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin')
const WebpackPwaManifest = require('webpack-pwa-manifest')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const {
  definePluginVariables,
  customPropertiesVariables,
} = require('./variables')

const postcssPlugins = () => [
  pxToRem({
    /* see options: https://github.com/cuth/postcss-pxtorem#options */
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

module.exports = {
  entry: ['./src/index'],
  output: {
    pathinfo: process.env.NODE_ENV === 'development',
    path: path.join(__dirname, '../dist/assets'),
    filename: '[name].js',
    publicPath: '/assets/',
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx'],
  },
  optimization: {
    moduleIds: 'deterministic',
    minimize: process.env.NODE_ENV === 'development',
    runtimeChunk: 'single',
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-helmet)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
        },
        react_table: {
          test: /[\\/]node_modules[\\/](react-table)[\\/]/,
          name: 'vendor-react-table',
          chunks: 'all',
        },
        react_intl: {
          test: /[\\/]node_modules[\\/](intl|react-intl)[\\/]/,
          name: 'vendor-intl',
          chunks: 'all',
        },
        redux: {
          test: /[\\/]node_modules[\\/](react-redux|redux|redux-thunk|redux-idle-monitor|redux-immutable)[\\/]/,
          name: 'vendor-redux',
          chunks: 'all',
        },
        rq: {
          test: /[\\/]node_modules[\\/](react-query)[\\/]/,
          name: 'vendor-react-query',
          chunks: 'all',
        },
        lodash: {
          test: /[\\/]node_modules[\\/](lodash)[\\/]/,
          name: 'vendor-lodash',
          chunks: 'all',
        },
        nivo: {
          test: /[\\/]node_modules[\\/]@nivo/,
          name: 'vendor-nivo',
          chunks: 'all',
        },
        mui: {
          test: /[\\/]node_modules[\\/]@material-ui/,
          name: 'vendor-material-ui',
          chunks: 'all',
        },
        dates: {
          test: /[\\/]node_modules[\\/](date-fns|date-fns-timezone)[\\/]/,
          name: 'vendor-date-fns',
          chunks: 'all',
        },
        formik: {
          test: /[\\/]node_modules[\\/](formik)[\\/]/,
          name: 'vendor-formik',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: [
          process.env.NODE_ENV === 'development'
            ? 'style-loader'
            : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]--[local]--[hash:base64:8]',
                exportLocalsConvention: 'camelCase',
              },
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: postcssPlugins(),
              },
            },
          },
        ],
      },
      /*
       * Webpack-5 introduced new types 'asset' for different resources.
       * Images worked well except image in web/src/template/index.html which
       * was not replaced with correct hashed name.
       * So, for now commented all `assets` and below used old `url-loader`,
       * 'file-loader' to handle resources.
       *
      {
        // images
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        // fonts
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        // video
        test: /\.(mp4|ogg)$/i,
        type: 'asset/resource',
      },
      */
      {
        test: /\.(png|jpg|gif|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              esModule: false,
            },
          },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.svg$/,
        include: path.resolve(__dirname, '../src'),
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              extract: true,
            },
          },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.(mp4|ogg|svg)$/,
        exclude: path.resolve(__dirname, '../src'),
        use: ['file-loader'],
        type: 'javascript/auto',
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: false,
            },
          },
        ],
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new DelWebpackPlugin({
      info: false,
    }),
    new webpack.DefinePlugin(definePluginVariables),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      /*
       * this prop is added by 'html-webpack-harddisk-plugin'
       * see see https://github.com/jantimon/html-webpack-harddisk-plugin
       */
      alwaysWriteToDisk: true,
      /*
       * see options - https://github.com/jantimon/html-webpack-plugin#options
       */
      inject: true,
      template: 'src/template/index.html',
      filename: 'index.html',
      favicon: path.join(__dirname, '../src/template/favicon.png'),
    }),
    new SpriteLoaderPlugin(),
    new WebpackPwaManifest({
      icons: [
        {
          src: path.join(__dirname, '../src/template/favicon.png'),
          sizes: [96, 128, 192],
        },
      ],
      name: 'Aspect',
      short_name: 'Aspect',
      start_url: '/login',
      display: 'standalone',
      background_color: '#eceff6',
      description:
        'Aspect is a data management platform that handles diagnostic data produced by medical devices in the field.',
    }),
    new HtmlWebpackHarddiskPlugin({
      outputPath: path.join(__dirname, '../dist'),
    }),
  ],
}
