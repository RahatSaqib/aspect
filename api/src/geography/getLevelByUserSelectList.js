const { getConstraints } = require('../auth/constraints')

module.exports = function ({ auth }) {
  const levels = filterByJobFunction(auth)
  return levels
}

async function filterByJobFunction(auth) {
  const dataConstraints = await getConstraints(auth.credentials)

  const countryLevel = { name: 'Country', id: 'country' }
  const stateLevel = { name: 'State', id: 'state' }
  const lgaLevel = { name: 'LGA', id: 'lga' }
  const siteLevel = { name: 'Laboratory', id: 'lab' }

  let level = []

  if (hasConstraintLevel(dataConstraints, 'country')) level = [countryLevel, stateLevel, lgaLevel, siteLevel]
  else if (hasConstraintLevel(dataConstraints, 'state')) level = [stateLevel, lgaLevel, siteLevel]
  else if (hasConstraintLevel(dataConstraints, 'lga')) level = [lgaLevel, siteLevel]
  else if (hasConstraintLevel(dataConstraints, 'site')) level = [siteLevel]

  return level
}

function hasConstraintLevel(dataConstraints, geographyLevel) {
  return dataConstraints.$or?.some(c => c.geography?.[`${geographyLevel}Id`] ?? false)
}
