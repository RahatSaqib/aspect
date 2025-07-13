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
  userSites.forEach(s => {
    s.sampleRegistrationAllowed = Boolean(s.sampleRegistrationAllowed)
  })
  const userSiteIds = userSites.map(us => us.id)
  const nonUserSitesInState = sitesInState.filter(s => !userSiteIds.includes(s.id))
  nonUserSitesInState.forEach(s => {
    // Sites for which the user does not have permissions cannot register
    // samples, only transfers are allowed. No matter site settings.
    s.sampleRegistrationAllowed = false
  })
  const totalSites = _.sortBy([...userSites, ...nonUserSitesInState], 'name')
  return { ok: true, data: totalSites }
}

module.exports = { listSites }
