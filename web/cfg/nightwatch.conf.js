require('dotenv-safe').load()
const _ = require('lodash')

const { SCREENSHOT_PATH } = require('../e2e/utils/testUtils')

const nightwatchConfig = {
  src_folders: ['e2e/tests'],
  output_folder: './reports',
  page_objects_path: './e2e/page_objects',

  selenium: {
    start_process: false,
    host: 'hub-cloud.browserstack.com',
    port: 80,
  },

  common_capabilities: {
    'browserstack.user': process.env['browserstack.user'],
    'browserstack.key': process.env['browserstack.key'],
    'browserstack.debug': true,
  },

  test_settings: {
    default: {
      launch_url: process.env.ASPECT_URL,
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
Object.keys(nightwatchConfig.test_settings).forEach(env => {
  const config = nightwatchConfig.test_settings[env]
  config.selenium_host = nightwatchConfig.selenium.host
  config.selenium_port = nightwatchConfig.selenium.port
  _.reduce(
    nightwatchConfig.common_capabilities,
    (result, value, key) => {
      let desiredCapabilities = result
      if (!desiredCapabilities) desiredCapabilities = {}
      desiredCapabilities[key] = value
      return desiredCapabilities
    },
    config.desiredCapabilities
  )
})

module.exports = nightwatchConfig
