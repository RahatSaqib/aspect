const { getUser } = require('../../auth/service')
const { knex } = require('../../db')

/**
 * Get FormData records for the currently logged-in user.
 * Filter by createdBy = user.id. Site constraints are not applied.
 */
async function listForms(request) {
  const { auth } = request
  const { siteId } = request.query || {}
  const user = await getUser(auth.credentials.name)
  if (!user) {
    return { ok: true, data: [] }
  }

  const rawRows = await knex('FormData as fd')
    .where('fd.createdBy', user.id)
    .modify(query => {
      if (siteId) {
        query.where('fd.siteId', siteId)
      }
    })
    .select('id', 'siteId', 'resultId', 'sampleExternalId', 'externalId', 'data', 'collectedOn')

  const rows = rawRows.map(({ data, ...row }) => ({ ...row, ...(typeof data === 'string' ? JSON.parse(data) : data) }))

  return { ok: true, data: rows }
}

module.exports = { listForms }
