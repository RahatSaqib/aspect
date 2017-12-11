const Promise = require('bluebird')

// helper function for run, transact and migration
const run = Promise.coroutine(function*(block, ...args) {
  try {
    return yield* block(...args)
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
    throw err
  }
})

function runGeneratedFunction(block, ...args) {
  return run(block, ...args)
}

module.exports = {
  runGeneratedFunction,
}
