const Promise = require('bluebird')
const { run } = require('../../src/db')

function runTest(generator, args = []) {
  return Promise.coroutine(function*(reply) {
    const result = yield* generator(...args)
    reply(result)
  })
}

const runTestWithKnex = function(test) {
  return run(function*(knex) {
    return yield* test(knex)
  })
}

module.exports = {
  runTest,
  runTestWithKnex,
}
