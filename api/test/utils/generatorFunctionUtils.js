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



// Number of milliseconds to wait for completion of
// asynchronous updates as acceptance criteria
const ASYNC_TEST_ACCEPTANCE_TIME = 250

// Waits acceptance time and resolves promise with optional result
function waitAsyncComplete(resolveWith) {
  return new Promise(resolve =>
    setTimeout(() => resolve(resolveWith), ASYNC_TEST_ACCEPTANCE_TIME)
  )
}

module.exports = {
  runTest,
  runTestWithKnex,
  waitForApproximately,
  waitAsyncComplete,
}
