const { knex } = require('../../db')
const { getConstraints, addConstraints, getUserFromCredentials } = require('../../auth/constraints')
const { assertDeploymentsEditable } = require('../common/deviceApprovalService')

/** Returns a Knex raw expression for the calendar date of r.endedOn in the user's timezone. */
function resultEndedOnDateInTZ(knex, timezoneIANA) {
  const tz = timezoneIANA || 'Etc/UTC'
  return knex.raw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?))', [tz])
}

async function checkAffectedResults(request) {
  const { params, auth, payload } = request
  const { deviceId } = params
  const { deployments } = payload

  await assertDeploymentsEditable(knex, deviceId)

  const [dataConstraints, user] = await Promise.all([
    getConstraints(auth.credentials),
    getUserFromCredentials(auth.credentials),
  ])
  const timezoneIANA = user?.timezoneIANA ?? user?.personTimezoneIANA ?? 'Etc/UTC'
  const endedOnDateExpr = resultEndedOnDateInTZ(knex, timezoneIANA)

  const moves = []

  // Sort chronologically: null start (oldest/first) comes first
  const sorted = [...deployments].sort((a, b) => {
    if (a.start === null) return -1
    if (b.start === null) return 1
    return new Date(a.start) - new Date(b.start)
  })

  // Check results that will move to a different site within each deployment span
  for (const dep of sorted) {
    const query = knex('Result as r')
      .where('r.deviceId', deviceId)
      .modify(qb => {
        // First deployment (null start) covers all results from the beginning
        if (dep.start) qb.where(endedOnDateExpr, '>=', dep.start)
        // Last deployment (null end) covers all results to the present
        if (dep.end) qb.where(endedOnDateExpr, '<=', dep.end)
      })
      .modify(addConstraints, dataConstraints, { result: 'r' })
      .andWhere(function () {
        if (dep.siteId) {
          this.where('r.siteId', '!=', dep.siteId).orWhereNull('r.siteId')
        } else {
          this.whereNotNull('r.siteId')
        }
      })
      .count('r.id as resultCount')
      .first()

    // eslint-disable-next-line no-await-in-loop
    const { resultCount } = await query

    if (resultCount > 0 && dep.siteId) {
      // eslint-disable-next-line no-await-in-loop
      const site = await knex('Site').where('id', dep.siteId).select('name').first()
      moves.push({
        siteId: dep.siteId,
        siteName: site ? site.name : null,
        resultCount,
      })
    }
  }

  // Continuous timeline has no gaps, so gaps array is always empty
  return { ok: true, data: { moves, gaps: [] } }
}

module.exports = { checkAffectedResults }
