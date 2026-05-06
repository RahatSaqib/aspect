const { subDays } = require('date-fns')
const { getUser } = require('../../auth/service')
const { knex } = require('../../db')

/**
 * Get FormData records for the currently logged-in user.
 * Filter by createdBy = user.id. Site constraints are not applied.
 */
async function listForms(request) {
  const { auth } = request
  const { siteId, modifiedDays } = request.query || {}
  const user = await getUser(auth.credentials.name)
  if (!user) {
    return { ok: true, data: [] }
  }

  const collectedSinceDate = modifiedDays ? subDays(new Date(), modifiedDays) : null

  const rawRows = await knex('FormData as fd')
    .leftJoin('Result as r', 'fd.resultId', 'r.id')
    .where('fd.createdBy', user.id)
    .modify(query => {
      if (siteId) {
        query.where('fd.siteId', siteId)
      }
      if (collectedSinceDate) {
        query.andWhere(dateQuery => dateQuery.where('fd.collectedOn', '>=', collectedSinceDate))
      }
    })
    .select(
      'fd.id',
      'fd.siteId',
      'fd.resultId',
      'r.endedOn as resultEndedOn',
      'fd.sampleExternalId',
      'fd.externalId',
      'fd.data',
      'fd.collectedOn'
    )

  const rows = rawRows.map(({ data, ...row }) => ({ ...row, ...(typeof data === 'string' ? JSON.parse(data) : data) }))

  return { ok: true, data: rows }
}

module.exports = { listForms }
