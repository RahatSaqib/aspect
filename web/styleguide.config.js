const path = require('path')
const glob = require('glob')
const _ = require('lodash')

const partialConfig = _.pick(
  require('./cfg/src.js').default({ ASPECT_TARGET: 'local' }),
  ['resolve', 'module', 'plugins']
)

partialConfig.plugins = partialConfig.plugins.filter(
  x => x.constructor.name === 'ExtractTextPlugin'
)

module.exports = {
  showUsage: true,
  components: () => [
    ...glob.sync('src/components/themedReactToolbox/!(index).{js,jsx}'),
    ...glob.sync(
      'src/components/shared/@(ReadOnlyField|ReadOnlyFields|FallbackUntilDone|FocusBlurTextField).{js,jsx}'
    ),
    ...glob.sync('src/components/chart/@(ChartContainer|ChartAlert).{js,jsx}'),
    ...glob.sync(
      'src/components/graph/@(BarGraph|ColumnGraph|LineGraph|CountryMap).{js,jsx}'
    ),
    ...glob.sync('src/components/shared/flagIcon/@(FlagIcon).{js,jsx}'),
  ],
  styleguideComponents: {
    Wrapper: path.join(
      __dirname,
      './src/globals/factories/uiProvidersFactory/StyleguidistWrapper.jsx'
    ),
  },
  webpackConfig: partialConfig,
}
