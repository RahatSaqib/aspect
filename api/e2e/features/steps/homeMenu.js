/* eslint-disable new-cap */
const _ = require('lodash')
const { Then } = require('@cucumber/cucumber')
const { assert } = require('chai')

Then('Has to have this menu {string}', async function (menuItems) {
  const { page } = this
  const homeMenu = await page.$$eval('header > div > nav > a > abbr', items =>
    items.map(item => item.innerText)
  )
  const menueItemShouldHave = menuItems.split(',')
  assert.equal(
    _.intersection(homeMenu, menueItemShouldHave).length,
    menueItemShouldHave.length
  )
})
