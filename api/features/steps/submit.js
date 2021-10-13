/* eslint-disable new-cap */
const { Then, And } = require('@cucumber/cucumber')
const { expect } = require('chai')

Then('Click Submit button', async () => {
  const [response] = await Promise.all([
    this.page.waitForNavigation(), // The promise resolves after navigation has finished
    this.page.click("input[type='submit']"), // Clicking the link will indirectly cause a navigation
  ])

  console.log('response', response)
})
