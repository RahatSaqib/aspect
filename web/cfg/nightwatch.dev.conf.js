require('dotenv-safe').load()

const SCREENSHOT_PATH = require('../e2e/utils/testUtils')

const BINPATH = '../node_modules/nightwatch/bin/'

module.exports = {
  src_folders: ['e2e/tests'],
  output_folder: './reports',
  page_objects_path: './e2e/page_objects',
  selenium: {
    start_process: true,
    server_path: '../node_modules/nightwatch/bin/selenium.jar',
    host: '127.0.0.1',
    port: 4444,
    cli_args: {
      'webdriver.chrome.driver': '../node_modules/nightwatch/bin/chromedriver',
    },
  },
  test_settings: {
    default: {
      launch_url: process.env.ASPECT_URL,
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

require('fs').stat(`${BINPATH}'selenium.jar`, (err, stat) => {
  if (err || !stat || stat.size < 1) {
    // ensure ensures that the selenium.jar and chromedriver files are in the path provided.
    // If they are not, the latest versions of both are downloaded into that path.
    require('selenium-download').ensure(BINPATH, (error) => { //eslint-disable-line
      if (error) throw new Error(error)
      console.log('✔ Selenium & Chromedriver downloaded to:', BINPATH) // eslint-disable-line
    })
  }
})
