const sinon = require('sinon')
const knex = require('knex')({
  client: 'mysql'
})

function buildKnexSpy(resolveWith) {
  const knexSpy = Promise.resolve(resolveWith)
  const returnKnexStub = function () {
    return knexSpy
  }
  for (const property in knex) {
    if ({}.hasOwnProperty.call(knex, property) && typeof knex[property] === 'function') {
      knexSpy[property] = returnKnexStub
      sinon.spy(knexSpy, property)
    }
  }
  return knexSpy
}

const knexSpies = {
  default: buildKnexSpy()
}

const query = function (queryDescription) {
  if (queryDescription && {}.hasOwnProperty.call(knexSpies, queryDescription)) {
    return knexSpies[queryDescription]
  }
  return knexSpies.default
}
query.for = function (queryDescription) {
  return {
    resolvesWith(returnData) {
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
