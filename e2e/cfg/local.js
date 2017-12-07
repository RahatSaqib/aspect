const path = require('path')
require('dotenv-safe').load()

const SCREENSHOT_PATH = require('../nightwatch/utils/testUtils')

module.exports = {
  src_folders: [path.resolve(__dirname, '../nightwatch/tests')],
  output_folder: path.resolve(__dirname, '../reports'),
  page_objects_path: path.resolve(__dirname, '../nightwatch/page_objects'),
  selenium: {
    start_process: true,
    server_path: path.resolve(
      __dirname,
      '../node_modules/selenium-local/selenium.jar'
    ),
    host: '127.0.0.1',
    port: 4444,
    cli_args: {
      'webdriver.chrome.driver': path.resolve(
        __dirname,
        '../node_modules/selenium-local/chromedriver'
      ),
    },
  },
  test_settings: {
    default: {
      launch_url: process.env.aspectUrl,
      screenshots: {
        enabled: true,
        path: SCREENSHOT_PATH,
      },
      globals: {
        waitForConditionTimeout: 5000,
      },
      desiredCapabilities: {
        browserName: 'chrome',
      },
    },
    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        javascriptEnabled: true,
      },
    },
  },
}
