const Boom = require('@hapi/boom')
const { addDays, format } = require('date-fns')
const { transact } = require('../../db')
const { getUserFromCredentials } = require('../../auth/constraints')
const { recalculateDeviceFactTables } = require('../common/logic')
const { toDateOnly } = require('../../shared/date')

function normalizeDeploymentDates(change) {
  const start = change.start != null ? toDateOnly(change.start) : null
  const end = change.end != null ? toDateOnly(change.end) : null
  if (start && end && end < start) {
    throw Boom.conflict('Deployment end date cannot be before start date')
  }
  return { start, end }
}

/** Returns a Knex raw expression for the calendar date of endedOn in the user's timezone. */
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

    // Apply updates
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

    // Load resulting deployments in chronological order (null start = oldest, comes first)
    const resultingDeployments = await trx('Deployment')
      .where('deviceId', deviceId)
      .orderByRaw('start IS NULL DESC, start ASC')
      .select('id', 'siteId', 'start', 'end')

    // If device becomes fully undeployed, clear all result site assignments
    if (resultingDeployments.length === 0) {
      await trx('Result').where('deviceId', deviceId).update({ siteId: null })
      await trx('Device').where('id', deviceId).update({ siteId: null })
      return
    }

    // Enforce continuous timeline invariants
    const nullStartCount = resultingDeployments.filter(d => d.start === null).length
    if (nullStartCount !== 1) {
      throw Boom.conflict('Exactly one deployment must have no start date (the first/oldest one)')
    }
    const nullEndCount = resultingDeployments.filter(d => d.end === null).length
    if (nullEndCount !== 1) {
      throw Boom.conflict('Exactly one deployment must be active (no end date)')
    }
    if (resultingDeployments[0].start !== null) {
      throw Boom.conflict('The oldest deployment must have no start date')
    }
    if (resultingDeployments[resultingDeployments.length - 1].end !== null) {
      throw Boom.conflict('The newest deployment must be active (no end date)')
    }

    // All adjacent pairs must be consecutive (no gaps, no overlaps)
    for (let i = 0; i < resultingDeployments.length - 1; i++) {
      const current = resultingDeployments[i]
      const next = resultingDeployments[i + 1]
      if (!current.end) {
        throw Boom.conflict('Only the last deployment may be active (have no end date)')
      }
      const currentEndDate = current.end
      const expectedNextStart = format(addDays(currentEndDate, 1), 'yyyy-MM-dd')
      if (toDateOnly(next.start) !== expectedNextStart) {
        throw Boom.conflict('Deployments must form a continuous timeline with no gaps or overlaps')
      }
    }

    // Update Result.siteId for each deployment span (result date in user timezone)
    const endedOnDateExpr = resultEndedOnDateInTZ(trx, timezoneIANA)
    const resultUpdatePromises = resultingDeployments.map(dep => {
      const query = trx('Result').where('deviceId', deviceId)
      // First deployment (null start) covers all results from the beginning
      if (dep.start !== null) {
        query.where(endedOnDateExpr, '>=', dep.start)
      }
      // Last deployment (null end) covers all results to the present
      if (dep.end !== null) {
        query.where(endedOnDateExpr, '<=', dep.end)
      }
      return query.update({ siteId: dep.siteId })
    })
    await Promise.all(resultUpdatePromises)

    // Sync Device.siteId with the active deployment
    const activeDeployment = resultingDeployments.find(d => d.end === null)
    await trx('Device')
      .where('id', deviceId)
      .update({ siteId: activeDeployment?.siteId ?? null })
  })

  await recalculateDeviceFactTables(messageContext, [parseInt(deviceId, 10)])
  return { ok: true }
}

module.exports = { persistDeploymentChanges }
