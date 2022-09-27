/**
 * Source: https://www.browserstack.com/automate/nightwatch
 */
require('dotenv-safe').config()
const browserstack = require('browserstack-local')
const Nightwatch = require('nightwatch')

try {
  process.mainModule.filename = './node_modules/.bin/nightwatch'

  // Code to start browserstack local before start of test
  // eslint-disable-next-line no-console
  console.log('Connecting local')
  Nightwatch.bs_local = new browserstack.Local()
  Nightwatch.bs_local.start({ key: process.env['browserstack.key'] }, error => {
    if (error) throw error

    // eslint-disable-next-line no-console
    console.log('Connected. Now testing...')
    Nightwatch.cli(argv => {
      Nightwatch.CliRunner(argv).setup(null, () => {
        // Code to stop browserstack local after end of parallel test
        Nightwatch.bs_local.stop(() => {})
      })
    })
  })
} catch (ex) {
  // eslint-disable-next-line no-console
  console.log('There was an error while starting the test runner:\n\n')
  process.stderr.write(`${ex.stack}\n`)
  process.exit(2)
}
