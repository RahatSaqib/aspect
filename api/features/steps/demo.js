/* eslint-disable new-cap */
const { When, Then, Given } = require('@cucumber/cucumber')
const { assert, expect } = require('chai')

Given('The browser is open', async function () {
  assert.isNotNull(this.page)
  assert.isNotEmpty(this.page)
})

When('open the page {string}', async function (string) {
  return this.page.goto(string)
})

When('open the Google page', async function () {
  await this.page.goto('https://google.com.ar')
})

When('search for Argentina', async function () {
  await this.page.waitForSelector("[name='q']")
  await this.page.type("[name='q']", 'Argentina')
  await this.page.keyboard.press('Enter')
})

Then('Search for html element {string}', async function (att) {
  const expetedDomElement = await this.page.$(`[data-test="${att}"]`)
  assert.isNotNull(expetedDomElement)
})

Then('Count results', async function () {
  await this.page.waitForNavigation()
  const linkTexts = await this.page.$$eval('#result-stats', elements =>
    elements.map(item => item.textContent)
  )
  expect(linkTexts).with.lengthOf(1)
})
