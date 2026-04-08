const { getConstraints } = require('../../../auth/constraints')
const { getSitesMobileView } = require('./db')

async function listSites(request) {
  const {
    auth: { credentials },
    query: { type, nameContains, modifiedSince },
  } = request

  const filters = {}
  if (nameContains && nameContains.length >= 3) {
    filters.nameContains = nameContains
  }
  if (modifiedSince) {
    filters.modifiedSince = modifiedSince
  }

  const dataConstraints = await getConstraints(credentials)
  const siteList = await getSitesMobileView(dataConstraints, type || ['clinic', 'lab'], 'name', filters)

  return { ok: true, data: siteList }
}

module.exports = { listSites }
