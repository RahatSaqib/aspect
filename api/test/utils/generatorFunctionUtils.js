const { run } = require('../../src/db')

function runTest(generator, args = []) {
  return async reply => {
    const result = await generator(...args)
    reply(result)
  }
}

const runTestWithKnex = function(test) {
  return run(async knex => test(knex))
}

function waitForApproximately(numberOf, units = 'milliseconds') {
  const unitInMilliseconds = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
  }
  let lowerUnits = units.toLowerCase()
  if (!lowerUnits.endsWith('s')) {
    lowerUnits += 's'
  }
  if (!unitInMilliseconds[lowerUnits]) {
    throw new Error('Invalid unit name')
  }
  return new Promise(resolve =>
    setTimeout(resolve, unitInMilliseconds[lowerUnits] * numberOf)
  )
}

module.exports = {
  runTest,
  runTestWithKnex,
  waitForApproximately,
}
