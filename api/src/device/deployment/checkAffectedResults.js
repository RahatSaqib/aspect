const { knex } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')

async function checkAffectedResults(request) {
  const { params, auth, payload } = request
  const { deviceId } = params
  const { deployments } = payload
  const dataConstraints = await getConstraints(auth.credentials)

  const moves = []
  const gaps = []

  // Sort deployments by start date ascending for gap detection
  const sorted = [...deployments].sort((a, b) => new Date(a.start) - new Date(b.start))

  // Check results that will be moved to a different site within each deployment span
  for (const dep of sorted) {
    const query = knex('Result as r')
      .where('r.deviceId', deviceId)
      .where(knex.raw('DATE(r.endedOn) >= DATE(?)', [dep.start]))
      .modify(qb => {
        if (dep.end) {
          qb.where(knex.raw('DATE(r.endedOn) <= DATE(?)', [dep.end]))
        }
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

  // Detect gaps between deployments where results would lose their siteId
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    // eslint-disable-next-line no-continue
    if (!current.end) continue // active deployment has no gap after it

    const gapStart = new Date(current.end)
    gapStart.setDate(gapStart.getDate() + 1)
    const gapEnd = new Date(next.start)
    gapEnd.setDate(gapEnd.getDate() - 1)

    // eslint-disable-next-line no-continue
    if (gapStart > gapEnd) continue // no gap

    // eslint-disable-next-line no-await-in-loop
    const { resultCount } = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .where(knex.raw('DATE(r.endedOn) >= DATE(?)', [gapStart]))
      .where(knex.raw('DATE(r.endedOn) <= DATE(?)', [gapEnd]))
      .whereNotNull('r.siteId')
      .modify(addConstraints, dataConstraints, { result: 'r' })
      .count('r.id as resultCount')
      .first()

    if (resultCount > 0) {
      gaps.push({
        start: gapStart.toISOString().slice(0, 10),
        end: gapEnd.toISOString().slice(0, 10),
        resultCount,
      })
    }
  }

  // Check gap before first deployment
  if (sorted.length > 0) {
    const first = sorted[0]
    const { resultCount } = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .where(knex.raw('DATE(r.endedOn) < DATE(?)', [first.start]))
      .whereNotNull('r.siteId')
      .modify(addConstraints, dataConstraints, { result: 'r' })
      .count('r.id as resultCount')
      .first()

    if (resultCount > 0) {
      gaps.push({
        start: null,
        end: new Date(new Date(first.start).getTime() - 86400000).toISOString().slice(0, 10),
        resultCount,
      })
    }
  }

  // Check gap after last deployment (only if last deployment is closed)
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1]
    if (last.end) {
      const { resultCount } = await knex('Result as r')
        .where('r.deviceId', deviceId)
        .where(knex.raw('DATE(r.endedOn) > DATE(?)', [last.end]))
        .whereNotNull('r.siteId')
        .modify(addConstraints, dataConstraints, { result: 'r' })
        .count('r.id as resultCount')
        .first()

      if (resultCount > 0) {
        gaps.push({
          start: new Date(new Date(last.end).getTime() + 86400000).toISOString().slice(0, 10),
          end: null,
          resultCount,
        })
      }
    }
  }

  return { ok: true, data: { moves, gaps } }
}

module.exports = { checkAffectedResults }
