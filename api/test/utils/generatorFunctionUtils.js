let Promise = require('bluebird')

function run(generator, args = []){
  return Promise.coroutine(function*(reply){
    let result = yield* generator(...args)
    reply(result)
  })
}

module.exports = {
  run
}
