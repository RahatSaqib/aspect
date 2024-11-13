const _ = require('lodash')
const { getConstraints } = require('../auth/constraints')
const { hasCountryLevelPermission } = require('../shared/utilsPerson')

const hasPermission = async req => {
  const { auth, query } = req
  const dataConstraints = await getConstraints(auth.credentials)
  const countryLevelPermission = await hasCountryLevelPermission(
    dataConstraints,
    _.isArray(query.permissions) ? query.permissions : [query.permissions]
  )
  return { ok: true, hasPermission: countryLevelPermission }
}

module.exports = {
  hasPermission,
}
