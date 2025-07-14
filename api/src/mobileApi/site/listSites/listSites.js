const _ = require('lodash')
const { getConstraints } = require('../../../auth/constraints')
const { getSitesMobileView } = require('./db')

async function listSites(request) {
  const {
    auth: { credentials },
    query: { type },
  } = request

  const dataConstraints = await getConstraints(credentials)
  const siteList = await getSitesMobileView(dataConstraints, type || ['clinic', 'lab'], 'name')

  return { ok: true, data: siteList }
}

module.exports = { listSites }
