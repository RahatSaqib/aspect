const Promise = require('bluebird')

function run(generator, args = []) {
  return Promise.coroutine(function*(reply) {
    const result = yield* generator(...args)
    reply(result)
  })
}

module.exports = {
  run,
}
