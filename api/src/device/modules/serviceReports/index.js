const Boom = require('@hapi/boom')
const { getConstraints } = require('../../../auth/constraints')
const { getErrorsByModules } = require('./getErrorsByModules')

async function getErrorsByModulesReport(auth, query) {
  const { minDate, maxDate } = query
  if (!minDate || !maxDate) {
    throw Boom.badRequest('Dates are required')
  }
  const dataConstraints = await getConstraints(auth.credentials)
  console.log('WHat is data Constraints ::: === >', dataConstraints)
  const data = await getErrorsByModules(dataConstraints, query)
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}

module.exports = {
  getErrorsByModulesReport,
}
