const _ = require('lodash')
const { getUserFromCredentials, getConstraints } = require('../../../auth/constraints')
const { getSitesInState, getUserSites } = require('./db')
const { SITE_TYPE_EXTERNAL_IDS } = require('../../../shared/constants')

async function listSites(request) {
  const {
    auth: { credentials },
    query: { stateId, type },
  } = request
  const user = await getUserFromCredentials(credentials)
  const sitesInState = await getSitesInState(
    user.partnerId,
    stateId ?? user.stateId,
    type || [SITE_TYPE_EXTERNAL_IDS.CLINIC, SITE_TYPE_EXTERNAL_IDS.LAB]
  )
  const dataConstraints = await getConstraints(credentials)
  const userSites = await getUserSites(
    dataConstraints,
    type || [SITE_TYPE_EXTERNAL_IDS.CLINIC, SITE_TYPE_EXTERNAL_IDS.LAB]
  )
  const nonUserSitesInState = sitesInState
    .filter(ss => !userSites.map(us => us.id).includes(ss.id))
    .map(ss => ({ ...ss, sampleRegistrationAllowed: ss.sampleRegistrationAllowed || false }))
  const totalSites = _.sortBy(
    [
      ...nonUserSitesInState,
      ...userSites.map(us => ({ ...us, sampleRegistrationAllowed: us.sampleRegistrationAllowed || false })),
    ],
    'name'
  )
  return { ok: true, data: totalSites }
}

module.exports = { listSites }
