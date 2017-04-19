import baseConfig from './base'

export default {
  ...baseConfig,
  devtool: 'inline-source-map',
  output: {
    ...baseConfig.output,
    pathinfo: true
  }
}
