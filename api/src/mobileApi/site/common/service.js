const { getUserFromCredentials } = require('../../../auth/constraints')
const { getSitesInState } = require('./db')

async function listSites(request) {
  const {
    auth: { credentials },
  } = request
  const user = await getUserFromCredentials(credentials)
  const sitesInState = await getSitesInState(user.partnerId, user.stateId)
  return { ok: true, data: sitesInState }
}

module.exports = { listSites }
