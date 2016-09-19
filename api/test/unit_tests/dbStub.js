let knex = require('knex')({
  client: 'mysql'
})

function buildKnexStub(resolveWith) {
  const knexStub = Promise.resolve(resolveWith)
  const returnKnexStub = function () {
    return knexStub
  }
  for (let property in knex) {
    if (knex.hasOwnProperty(property) && typeof knex[property] === 'function') {
      knexStub[property] = returnKnexStub
    }
  }
  return knexStub
}

const knexStubs = {
  'default': buildKnexStub()
}

const query = function(queryDescription) {
  if(queryDescription && knexStubs.hasOwnProperty(queryDescription)){
    return knexStubs[queryDescription]
  }
  return knexStubs.default
}
query.for = function (queryDescription) {
  return {
    resolvesWith: function(returnData) {
      knexStubs[queryDescription] = buildKnexStub(returnData)
    }
  }
}

module.exports = {
  query
}
