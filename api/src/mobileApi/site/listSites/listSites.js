const _ = require('lodash')
const { getUserFromCredentials, getConstraints } = require('../../../auth/constraints')
const { getSitesInState, getUserSites } = require('./db')

async function listSites(request) {
  const {
    auth: { credentials },
    query: { stateId, type },
  } = request
  const user = await getUserFromCredentials(credentials)
  const sitesInState = await getSitesInState(user.partnerId, stateId ?? user.stateId, type || ['clinic', 'lab'])
  const dataConstraints = await getConstraints(credentials)
  const userSites = await getUserSites(dataConstraints, type || ['clinic', 'lab'])
  const userSiteIds = userSites.map(us => us.id)
  const nonUserSitesInState = sitesInState.filter(ss => !userSiteIds.includes(ss.id))

  const totalSites = _.sortBy(
    [...nonUserSitesInState, ...userSites].map(site => ({
      ...site,
      sampleRegistrationAllowed: Boolean(site.sampleRegistrationAllowed),
    })),
    'name'
  )
  return { ok: true, data: totalSites }
}

module.exports = { listSites }
