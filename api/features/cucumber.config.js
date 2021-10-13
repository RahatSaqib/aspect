/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const {
  BeforeAll,
  AfterAll,
  setDefaultTimeout,
  setWorldConstructor,
  World,
} = require('@cucumber/cucumber')
const puppeteer = require('puppeteer')
const context = require('./context/scope')

class CustomWorld extends World {
  constructor(browser, page, options = {}) {
    super(options)

    this.browser = browser
    this.page = page
  }
}
setDefaultTimeout(60 * 1000)

BeforeAll(async function () {
  const world = this
  const browser = await puppeteer.launch({
    headless: true,
  })
  const page = await browser.newPage()
  setWorldConstructor(new CustomWorld(browser, page))
})

AfterAll(function () {
  const world = this
  // console.log('config', this)
  return this.browser.close()
})
