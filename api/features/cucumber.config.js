/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { Before, After } = require('@cucumber/cucumber')
const puppeteer = require('puppeteer')
const { setDefaultTimeout } = require('@cucumber/cucumber')

setDefaultTimeout(60 * 1000)

Before(async function () {
  const world = this
  const browser = await puppeteer.launch({
    headless: true,
  })
  const page = await this.browser.newPage()
  world._browser = browser
  world.page = page
})

After(function () {
  const world = this
  console.log('this', world.attach, world.log)
  return this._browser.close()
})
