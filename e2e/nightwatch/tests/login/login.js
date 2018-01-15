const utils = require('../../utils/testUtils')

module.exports = {
  '@tags': ['login'],
  'Aspect  - Redirect and Assert Login Elements': client => {
    const login = client.page.login()
    login.navigate()

    client.waitForElementVisible('div[id=I-am-reactroot]', 5000)

    login.assert
      .title('Login - Aspect')
      .assert.visible('@textField')
      .assert.visible('@passwordField')
      .assert.visible('@logo')

    client.saveScreenshot(`${utils.imgpath(client)}aspect-test.png`)
    client.end()
  },

  'Aspect  - Alert wrong Password': client => {
    const login = client.page.login()

    login.navigate()
    client.waitForElementVisible('body', 5000)

    login
      .setValue('@textField', 'wronguser')
      .setValue('@passwordField', 'wrongPassword')
      .assert.urlEquals(`${login.url}/login`)
      .click('@submit')

    client.pause(5000)
    login.assert.containsText('@h3Title', 'Login Failed')
    client.saveScreenshot(`${utils.imgpath(client)}aspect-test.png`)
    client.end()
  },

  'Aspect  - Redirect Dashboard on Successful Log In': client => {
    const login = client.page.login()
    login.navigate()
    client.waitForElementVisible('body', 5000)

    login
      .setValue('@textField', 'admin')
      .setValue('@passwordField', 'test07')
      .click('@submit')
    client
      .pause(5000)
      // ensure we redirect to Dashboard successfully
      .assert.urlEquals(`${login.url}/dashboard`)
    client.saveScreenshot(`${utils.imgpath(client)}aspect-test.png`)
    client.end()
  },

  'Aspect  - Redirect to reset password': client => {
    const login = client.page.login()
    login.navigate()
    client.waitForElementVisible('body', 4000)

    login.click('@forgotPasswordLink')
    client.pause(2000).assert.urlEquals(`${login.url}/reset-password`)
    client.saveScreenshot(`${utils.imgpath(client)}aspect-test.png`)
    client.end()
  },
}
