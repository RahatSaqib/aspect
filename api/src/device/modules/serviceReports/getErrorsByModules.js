const _ = require('lodash')
const { knex, filterParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')
const { getResultsByModuleErrorsWithinTimeFrame } = require('../db')

async function getErrorsByModules(dataConstraints, query) {
  const data = await getResultsByModuleErrorsWithinTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })

  return data
}

module.exports = {
  getErrorsByModules,
}
