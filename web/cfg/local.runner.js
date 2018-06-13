/**
 * Source: https://www.browserstack.com/automate/nightwatch
 */
require('dotenv-safe').load()
const Nightwatch = require('nightwatch')
const browserstack = require('browserstack-local')

try {
  process.mainModule.filename = './node_modules/.bin/nightwatch'

  // Code to start browserstack local before start of test
  console.log('Connecting local')
  Nightwatch.bs_local = new browserstack.Local()
  Nightwatch.bs_local.start({ key: process.env['browserstack.key'] }, error => {
    if (error) throw error

    console.log('Connected. Now testing...')
    Nightwatch.cli(argv => {
      Nightwatch.CliRunner(argv).setup(null, () => {
        // Code to stop browserstack local after end of parallel test
        Nightwatch.bs_local.stop(() => {})
      })
    })
  })
} catch (ex) {
  console.log('There was an error while starting the test runner:\n\n')
  process.stderr.write(`${ex.stack}\n`)
  process.exit(2)
}
