/* eslint-disable new-cap */
const { When, Then, And } = require('@cucumber/cucumber')
const { expect } = require('chai')
const puppeteer = require('puppeteer')

const { setDefaultTimeout } = require('@cucumber/cucumber')

setDefaultTimeout(60 * 1000)

const generalRegex = /^Type "([^"])*" in "([^"])*" TextField$/
const generalFn = async (text, textField) => {
  await this.page.waitForSelector(`input[name='${textField}']`)
  await this.page.type(`input[name='${textField}']`, text)
}

When(/^'open the page {2}"([^"])*"$/, async function (page) {
  await this.page.goto(page)
})
Then(generalRegex, generalFn)
And(generalRegex, generalFn)
When(generalRegex, generalFn)

// When('search for Argentina', async function () {
//   await this.page.waitForSelector("[name='q']")
//   await this.page.type("[name='q']", 'Argentina')
//   await this.page.keyboard.press('Enter')
// })

// Then('Count results', async function () {
//   await this.page.waitForNavigation()
//   const linkTexts = await this.page.$$eval('#result-stats', elements =>
//     elements.map(item => item.textContent)
//   )
//   expect(linkTexts).with.lengthOf(1)

//   // uncomment close statement if you want
//   await this.browser.close()
// })
