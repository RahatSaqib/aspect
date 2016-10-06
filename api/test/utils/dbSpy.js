let sinon = require('sinon')
let knex = require('knex')({
  client: 'mysql'
})

function buildKnexSpy(resolveWith) {
  const knexSpy = Promise.resolve(resolveWith)
  const returnKnexStub = function () {
    return knexSpy
  }
  for (let property in knex) {
    if (knex.hasOwnProperty(property) && typeof knex[property] === 'function') {
      knexSpy[property] = returnKnexStub
      sinon.spy(knexSpy, property)
    }
  }
  return knexSpy
}

const knexSpies = {
  'default': buildKnexSpy()
}

const query = function(queryDescription) {
  if(queryDescription && knexSpies.hasOwnProperty(queryDescription)){
    return knexSpies[queryDescription]
  }
  return knexSpies.default
}
query.for = function (queryDescription) {
  return {
    resolvesWith: function(returnData) {
      knexSpies[queryDescription] = buildKnexSpy(returnData)
    }
  }
}

module.exports = {
  query,
  knex: {
    raw: sinon.stub()
  }
}
