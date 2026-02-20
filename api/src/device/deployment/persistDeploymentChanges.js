const Boom = require('@hapi/boom')
const { addDays, subDays, format, parseISO } = require('date-fns')
const { transact } = require('../../db')
const { getUserFromCredentials } = require('../../auth/constraints')
const { recalculateDeviceFactTables } = require('../common/logic')
const { parseDateOrDefault } = require('../../shared/date')

/** Persist date-only as sent; no timezone conversion (deployment start/end are calendar dates). */
function toDateOnlyStr(val) {
  if (val == null) return null
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10)
  const d = parseDateOrDefault(val)
  return d ? d.toISOString().slice(0, 10) : null
}

function normalizeDeploymentDates(change) {
  const start = toDateOnlyStr(change.start)
  const end = change.end != null ? toDateOnlyStr(change.end) : null
  if (start && end && end < start) {
    throw Boom.conflict('Deployment end date cannot be before start date')
  }
  return { start, end }
}

function resultEndedOnDateInTZ(trx, timezoneIANA) {
  const tz = timezoneIANA || 'Etc/UTC'
  return trx.raw('DATE(CONVERT_TZ(endedOn, "+00:00", ?))', [tz])
}

async function persistDeploymentChanges(request) {
  const {
    params,
    auth,
    payload,
    plugins: { messageContext },
  } = request
  const { deviceId } = params
  const { changes } = payload
  const user = await getUserFromCredentials(auth.credentials)
  const timezoneIANA = user?.timezoneIANA ?? user?.personTimezoneIANA ?? 'Etc/UTC'
  const now = new Date()

  await transact(async trx => {
    // Apply deletes
    const deletePromises = changes
      .filter(c => c.action === 'delete')
      .map(change => trx('Deployment').where('id', change.id).where('deviceId', deviceId).del())
    await Promise.all(deletePromises)

    // Apply updates (persist start/end as date only, as sent by client — no timezone conversion)
    const updatePromises = changes
      .filter(c => c.action === 'update')
      .map(change => {
        const { start, end } = normalizeDeploymentDates(change)
        return trx('Deployment').where('id', change.id).where('deviceId', deviceId).update({
          siteId: change.siteId,
          start,
          end,
          updatedOn: now,
          updatedBy: user.id,
        })
      })
    await Promise.all(updatePromises)

    // Apply inserts
    const insertPromises = changes
      .filter(c => c.action === 'add')
      .map(change => {
        const { start, end } = normalizeDeploymentDates(change)
        return trx('Deployment').insert({
          deviceId,
          siteId: change.siteId,
          start,
          end,
          createdOn: now,
          createdBy: user.id,
          updatedOn: now,
          updatedBy: user.id,
        })
      })
    await Promise.all(insertPromises)

    // Validate no overlaps in resulting deployment set (compare date-only values as stored, no timezone)
    const resultingDeployments = await trx('Deployment')
      .where('deviceId', deviceId)
      .orderBy('start', 'asc')
      .select('id', 'siteId', 'start', 'end')

    for (let i = 0; i < resultingDeployments.length - 1; i++) {
      const current = resultingDeployments[i]
      const next = resultingDeployments[i + 1]

      if (!current.end) {
        throw Boom.conflict('An open deployment must be the last one in the timeline')
      }

      const currentEndDateStr = toDateOnlyStr(current.end)
      const nextStartDateStr = toDateOnlyStr(next.start)
      if (currentEndDateStr >= nextStartDateStr) {
        throw Boom.conflict('Deployment periods must not overlap')
      }
    }

    // Update Result.siteId for each deployment span (compare result date in user timezone from auth to deployment date)
    const endedOnDateExpr = resultEndedOnDateInTZ(trx, timezoneIANA)
    const resultUpdatePromises = resultingDeployments.map(dep => {
      const query = trx('Result').where('deviceId', deviceId).where(endedOnDateExpr, '>=', dep.start)
      if (dep.end) {
        query.where(endedOnDateExpr, '<=', dep.end)
      }
      return query.update({ siteId: dep.siteId })
    })
    await Promise.all(resultUpdatePromises)

    // Set Result.siteId = NULL for results in gaps (compare result date in user timezone from auth)
    if (resultingDeployments.length > 0) {
      const first = resultingDeployments[0]
      await trx('Result').where('deviceId', deviceId).where(endedOnDateExpr, '<', first.start).update({ siteId: null })
    }

    // Gaps between deployments (date-based)
    for (let i = 0; i < resultingDeployments.length - 1; i++) {
      const current = resultingDeployments[i]
      const next = resultingDeployments[i + 1]

      if (current.end) {
        const currentEndDate = typeof current.end === 'string' ? parseISO(current.end) : new Date(current.end)
        const nextStartDate = typeof next.start === 'string' ? parseISO(next.start) : new Date(next.start)
        const gapStartStr = format(addDays(currentEndDate, 1), 'yyyy-MM-dd')
        const gapEndStr = format(subDays(nextStartDate, 1), 'yyyy-MM-dd')
        if (gapStartStr <= gapEndStr) {
          // eslint-disable-next-line no-await-in-loop -- sequential updates per gap
          await trx('Result')
            .where('deviceId', deviceId)
            .where(endedOnDateExpr, '>=', gapStartStr)
            .where(endedOnDateExpr, '<=', gapEndStr)
            .update({ siteId: null })
        }
      }
    }

    if (resultingDeployments.length > 0) {
      const last = resultingDeployments[resultingDeployments.length - 1]
      if (last.end) {
        await trx('Result').where('deviceId', deviceId).where(endedOnDateExpr, '>', last.end).update({ siteId: null })
      }
    }

    // Sync Device.siteId with the active deployment
    const activeDeployment = resultingDeployments.find(d => !d.end)
    await trx('Device')
      .where('id', deviceId)
      .update({ siteId: activeDeployment ? activeDeployment.siteId : null })
  })

  // Trigger fact table recalculation after commit
  await recalculateDeviceFactTables(messageContext, [parseInt(deviceId, 10)])

  return { ok: true }
}

module.exports = { persistDeploymentChanges }
