/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber')
const { chromium } = require('playwright')

// setDefaultTimeout(60 * 1000)
// setWorldConstructor(CustomWorld)

Before(async function () {
  const world = this
  const browser = await chromium.launch({ headless: true })
  world.browser = browser
  world.page = await browser.newPage()
  // console.log('Before All', world)
  // await world.setBrowser(browser)
})

After(function () {
  return this.browser.close()
})
