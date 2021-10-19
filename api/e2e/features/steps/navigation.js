/* eslint-disable new-cap */
const { When, Then, Given } = require('@cucumber/cucumber')
const { assert } = require('chai')

Given('The browser is open', async function () {
  assert.isNotNull(this.page)
  assert.isNotEmpty(this.page)
})

When('open the page {string}', async function (string) {
  return this.page.goto(string)
})

Then('Search for html element {string}', async function (att) {
  const expetedDomElement = await this.page.$(`[data-test="${att}"]`)
  assert.isNotNull(expetedDomElement)
})

When(/^'open the page {2}"([^"])*"$/, async function (page) {
  await this.page.goto(page)
})
