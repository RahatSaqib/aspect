const path = require('path')
const glob = require('glob')
const pick = require('lodash/pick')

const partialConfig = pick(require('./cfg/dev.js'), ['resolve', 'module', 'plugins'])

partialConfig.plugins = partialConfig.plugins.filter(x => x.constructor.name === 'ExtractTextPlugin')

module.exports = {
  showUsage: true,
  components: () => [
    ...glob.sync('src/components/themedReactToolbox/!(index).{js,jsx}'),
    ...glob.sync('src/components/shared/@(ReadOnlyField|ReadOnlyFields|FallbackUntilDone|FocusBlurTextField).{js,jsx}'),
    ...glob.sync('src/components/shared/flagIcon/@(FlagIcon).{js,jsx}'),
    ...glob.sync('src/components/shared/@(accordion|data-table)/!(index).{js,jsx}'),
  ],
  styleguideComponents: {
    Wrapper: path.join(__dirname, './src/globals/factories/uiProvidersFactory/StyleguidistWrapper.jsx'),
  },
  webpackConfig: partialConfig,
}
