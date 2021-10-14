/* eslint-disable new-cap */
const { Then } = require('@cucumber/cucumber')

Then('Click Submit button', async function () {
  const { page } = this
  await Promise.all([
    // page.click('button[type=submit]'),
    page.keyboard.press('Enter'),
    page.waitForNavigation(),
  ])
})
