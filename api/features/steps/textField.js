/* eslint-disable new-cap */
const { Then } = require('@cucumber/cucumber')

Then(
  'Type {string} in {string} TextField',
  async function (text1, textFieldName) {
    await this.page.waitForSelector(`input[name='${textFieldName}']`)
    await this.page.type(`input[name='${textFieldName}']`, text1)
  }
)
