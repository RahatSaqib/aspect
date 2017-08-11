require('babel-register')
const path = require('path')
const glob = require('glob')
const _ = require('lodash')

const partialConfig = _.pick(
  require('./cfg/src.babel.js').default({ ASPECT_TARGET: 'local' }),
  ['resolve', 'module', 'plugins']
)

partialConfig.plugins = partialConfig.plugins.filter(
  x => x.constructor.name === 'ExtractTextPlugin'
)

module.exports = {
  components: () => [
    ...glob.sync('src/components/themedReactToolbox/!(index).{js,jsx}'),
    ...glob.sync(
      'src/components/shared/@(ReadOnlyField|ReadOnlyFields|FallbackUntilDone|FocusBlurTextField).{js,jsx}'
    ),
    ...glob.sync(
      'src/components/graph/@(BarChart|ColumnChart|LineChart|ChartContainer|ChartAlert).{js,jsx}'
    ),
    ...glob.sync('src/components/shared/flagIcon/@(FlagIcon).{js,jsx}'),
  ],
  styleguideComponents: {
    Wrapper: path.join(__dirname, './src/globals/layouts/UIThemeProviders.jsx'),
  },
  webpackConfig: partialConfig,
}
