/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { Before, After } = require('@cucumber/cucumber')
const puppeteer = require('puppeteer')
const { setDefaultTimeout } = require('@cucumber/cucumber')

setDefaultTimeout(60 * 1000)

Before(async () => {
  const world = this
  world._browser = await puppeteer.launch({
    headless: true,
  })
  world.page = await this.browser.newPage()
})

After(() => this._browser.close())
