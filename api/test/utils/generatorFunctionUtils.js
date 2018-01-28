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

module.exports = {
  runTest,
  runTestWithKnex,
}
