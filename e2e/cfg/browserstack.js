const path = require('path')
require('dotenv-safe').load()
const _ = require('lodash')

const { SCREENSHOT_PATH } = require('../nightwatch/utils/testUtils')

const nightwatchConfig = {
  src_folders: [path.resolve(__dirname, '../nightwatch/tests')],
  output_folder: path.resolve(__dirname, '../reports'),
  page_objects_path: path.resolve(__dirname, '../nightwatch/page_objects'),

  selenium: {
    start_process: false,
    host: 'hub-cloud.browserstack.com',
    port: 80,
  },

  common_capabilities: {
    project: 'Aspect',
    name: 'Aspect',
    'browserstack.user': process.env['browserstack.user'],
    'browserstack.key': process.env['browserstack.key'],
    'browserstack.local': true,
    'browserstack.debug': true,
  },

  test_settings: {
    default: {
      launch_url: process.env.aspectUrl,
      screenshots: {
        enabled: true,
        path: SCREENSHOT_PATH,
      },
    },
    chrome: {
      desiredCapabilities: {
        browser: 'chrome',
      },
    },
    firefox: {
      desiredCapabilities: {
        browser: 'firefox',
      },
    },
    safari: {
      desiredCapabilities: {
        browser: 'safari',
      },
    },
    ie: {
      desiredCapabilities: {
        browser: 'internet explorer',
      },
    },
    edge: {
      desiredCapabilities: {
        browser: 'edge',
      },
    },
  },
}

// Code to support common capabilites
_.forEach(nightwatchConfig.test_settings, config => {
  config.selenium_host = nightwatchConfig.selenium.host
  config.selenium_port = nightwatchConfig.selenium.port
  config.desiredCapabilities = _.assign(
    {},
    config.desiredCapabilities,
    nightwatchConfig.common_capabilities
  )
})

module.exports = nightwatchConfig
