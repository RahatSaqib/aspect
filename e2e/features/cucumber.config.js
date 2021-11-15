/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { Before, After } = require('@cucumber/cucumber')
const { chromium } = require('playwright')

Before(async function () {
  const world = this
  const browser = await chromium.launch({ headless: true })
  world.browser = browser
  world.page = await browser.newPage()
})

After(function () {
  return this.browser.close()
})
