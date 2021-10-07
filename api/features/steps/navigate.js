/* eslint-disable new-cap */
const { When, Then, And, Given, AfterAll } = require('@cucumber/cucumber')
const { expect } = require('chai')
const puppeteer = require('puppeteer')

const { setDefaultTimeout } = require('@cucumber/cucumber')

setDefaultTimeout(60 * 1000)

Given('The browser is open', async function () {
  this.browser = await puppeteer.launch({
    headless: true,
    executablePath: 'google-chrome',
  })
  this.page = await this.browser.newPage()
})

When('open the Google page', async function () {
  await this.page.goto('https://google.com.ar')
})

When('search for Argentina', async function () {
  await this.page.waitForSelector("[name='q']")
  await this.page.type("[name='q']", 'Argentina')
  await this.page.keyboard.press('Enter')
})

Then('Count results', async function () {
  await this.page.waitForNavigation()
  const linkTexts = await this.page.$$eval('#result-stats', elements =>
    elements.map(item => item.textContent)
  )
  expect(linkTexts).with.lengthOf(1)

  // uncomment close statement if you want
  await this.browser.close()
})
