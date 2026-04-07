const { getConstraints } = require('../../../auth/constraints')
const { clientTypes } = require('../../../auth/service')
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

  const effectiveClientType = credentials.clientType == null ? clientTypes.reporter_app : credentials.clientType
  const includeStateWideSites = effectiveClientType === clientTypes.reporter_app

  const dataConstraints = await getConstraints(credentials)
  const siteList = await getSitesMobileView(
    dataConstraints,
    type || ['clinic', 'lab'],
    'name',
    filters,
    includeStateWideSites
  )

  return { ok: true, data: siteList }
}

module.exports = { listSites }
