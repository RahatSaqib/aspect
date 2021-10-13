/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { BeforeAll, AfterAll } = require('@cucumber/cucumber')
const puppeteer = require('puppeteer')
const { setDefaultTimeout } = require('@cucumber/cucumber')

setDefaultTimeout(60 * 1000)

BeforeAll(async function () {
  const world = this
  const browser = await puppeteer.launch({
    headless: true,
  })
  const page = await browser.newPage()
  world._browser = browser
  world.page = page
})

AfterAll(function () {
  const world = this
  return this._browser.close()
})
