const appWebpack = require('../cfg/dev.js')

const isCSSRule = rule => rule.test.toString() === '/\\.css$/'

module.exports = {
  webpackFinal: config => {
    config.module.rules = config.module.rules.filter(rule => !isCSSRule(rule))
    config.module.rules.push(appWebpack.module.rules.find(isCSSRule))
    return config
  },
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
}
