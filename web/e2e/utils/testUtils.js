const _ = require('lodash')

const PKG = require('../../package.json')

const SCREENSHOT_PATH = `./screenshots/${PKG.version}/`
let FILECOUNT = 0

module.exports = {
  /**
 * Function that returns the correct path for storing  screenshots.
 * Adds some meta-data to the filename, specifically
 * the Platform/Browser where the test was run and the test (file) name.
 */
  imgpath: browser => {
    const a = browser.options.desiredCapabilities
    const meta = [a.platform]
    meta.push(a.browserName ? a.browserName : 'any')
    meta.push(a.version ? a.version : 'any')
    meta.push(a.name)
    const metadata = meta
      .join('~')
      .toLowerCase()
      .replace(/ /g, '')
    FILECOUNT += 1
    return `${SCREENSHOT_PATH}${metadata}_${_.padStart(FILECOUNT, 2, '0')}_`
  },
  SCREENSHOT_PATH,
}
