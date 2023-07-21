const { getUserFromCredentials } = require('../../../auth/constraints')
const { getSitesInState } = require('./db')

async function listSites(request) {
  const {
    auth: { credentials },
    query: { stateId, type },
  } = request
  const user = await getUserFromCredentials(credentials)
  const sitesInState = await getSitesInState(user.partnerId, stateId || user.stateId, type || 'clinic')
  return { ok: true, data: sitesInState }
}

module.exports = { listSites }
