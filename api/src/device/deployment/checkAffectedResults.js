const { addDays, subDays, format, parseISO } = require('date-fns')
const { knex } = require('../../db')
const { getConstraints, addConstraints, getUserFromCredentials } = require('../../auth/constraints')

function resultEndedOnDateInTZ(knex, timezoneIANA) {
  const tz = timezoneIANA || 'Etc/UTC'
  return knex.raw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?))', [tz])
}

async function checkAffectedResults(request) {
  const { params, auth, payload } = request
  const { deviceId } = params
  const { deployments } = payload
  const [dataConstraints, user] = await Promise.all([
    getConstraints(auth.credentials),
    getUserFromCredentials(auth.credentials),
  ])
  const timezoneIANA = user?.timezoneIANA ?? user?.personTimezoneIANA ?? 'Etc/UTC'
  const endedOnDateExpr = resultEndedOnDateInTZ(knex, timezoneIANA)

  const moves = []
  const gaps = []

  // Sort deployments by start date ascending for gap detection
  const sorted = [...deployments].sort((a, b) => new Date(a.start) - new Date(b.start))

  // Check results that will be moved to a different site within each deployment span (result date in user TZ from auth)
  for (const dep of sorted) {
    const query = knex('Result as r')
      .where('r.deviceId', deviceId)
      .where(endedOnDateExpr, '>=', dep.start)
      .modify(qb => {
        if (dep.end) {
          qb.where(endedOnDateExpr, '<=', dep.end)
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

  // Detect gaps between deployments where results would lose their siteId (result date in user TZ from auth)
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    // eslint-disable-next-line no-continue
    if (!current.end) continue // active deployment has no gap after it

    const currentEndDate = typeof current.end === 'string' ? parseISO(current.end) : new Date(current.end)
    const nextStartDate = typeof next.start === 'string' ? parseISO(next.start) : new Date(next.start)
    const gapStartStr = format(addDays(currentEndDate, 1), 'yyyy-MM-dd')
    const gapEndStr = format(subDays(nextStartDate, 1), 'yyyy-MM-dd')

    // eslint-disable-next-line no-continue
    if (gapStartStr > gapEndStr) continue // no gap

    // eslint-disable-next-line no-await-in-loop
    const { resultCount } = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .where(endedOnDateExpr, '>=', gapStartStr)
      .where(endedOnDateExpr, '<=', gapEndStr)
      .whereNotNull('r.siteId')
      .modify(addConstraints, dataConstraints, { result: 'r' })
      .count('r.id as resultCount')
      .first()

    if (resultCount > 0) {
      gaps.push({
        start: gapStartStr,
        end: gapEndStr,
        resultCount,
      })
    }
  }

  // Check gap before first deployment
  if (sorted.length > 0) {
    const first = sorted[0]
    const firstStartStr = typeof first.start === 'string' ? first.start : format(new Date(first.start), 'yyyy-MM-dd')
    const { resultCount } = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .where(endedOnDateExpr, '<', firstStartStr)
      .whereNotNull('r.siteId')
      .modify(addConstraints, dataConstraints, { result: 'r' })
      .count('r.id as resultCount')
      .first()

    if (resultCount > 0) {
      const firstStartDate = typeof first.start === 'string' ? parseISO(first.start) : new Date(first.start)
      gaps.push({
        start: null,
        end: format(subDays(firstStartDate, 1), 'yyyy-MM-dd'),
        resultCount,
      })
    }
  }

  // Check gap after last deployment (only if last deployment is closed)
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1]
    if (last.end) {
      const lastEndStr = typeof last.end === 'string' ? last.end : format(new Date(last.end), 'yyyy-MM-dd')
      const { resultCount } = await knex('Result as r')
        .where('r.deviceId', deviceId)
        .where(endedOnDateExpr, '>', lastEndStr)
        .whereNotNull('r.siteId')
        .modify(addConstraints, dataConstraints, { result: 'r' })
        .count('r.id as resultCount')
        .first()

      if (resultCount > 0) {
        const lastEndDate = typeof last.end === 'string' ? parseISO(last.end) : new Date(last.end)
        gaps.push({
          start: format(addDays(lastEndDate, 1), 'yyyy-MM-dd'),
          end: null,
          resultCount,
        })
      }
    }
  }

  return { ok: true, data: { moves, gaps } }
}

module.exports = { checkAffectedResults }
