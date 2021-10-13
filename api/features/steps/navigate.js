/* eslint-disable new-cap */
const { When, Then, Given } = require('@cucumber/cucumber')
const { assert, expect } = require('chai')
const context = require('../context/scope')

Given('The browser is open', async function () {
  const world = this
  console.log('this', this, world)
  assert.isNotNull(this.page)
  assert.isNotEmpty(this.page)
})

When(/^'open the page {2}"([^"])*"$/, async function (page) {
  await this.page.goto(page)
})

When('open the Google page', async function () {
  await this.page.goto('https://google.com.ar')
})

When('search for Argentina', async function () {
  await this.page.waitForSelector("[name='q']")
  await this.page.type("[name='q']", 'Argentina')
  await this.page.keyboard.press('Enter')
})
Then(
  /^Search for "([^"])*" attribute in type "([^"])*"$/,
  async (att, domElement) => {
    const expetedDomElement = await this.page.$(`${domElement}[${att}]`)
    console.log('expetedDomElement', expetedDomElement)
    assert.isNotNull(expetedDomElement)
    // await this.page.type("[name='q']", 'Argentina')
  }
)

Then('Count results', async function () {
  await this.page.waitForNavigation()
  const linkTexts = await this.page.$$eval('#result-stats', elements =>
    elements.map(item => item.textContent)
  )
  expect(linkTexts).with.lengthOf(1)

  // uncomment close statement if you want
  // await this.browser.close()
})
