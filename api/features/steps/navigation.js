/* eslint-disable new-cap */
const { When } = require('@cucumber/cucumber')

When(/^'open the page {2}"([^"])*"$/, async function (page) {
  await this.page.goto(page)
})
