const Boom = require('@hapi/boom')
const { transact } = require('../../db')
const { getUserFromCredentials } = require('../../auth/constraints')
const { recalculateDeviceFactTables } = require('../common/logic')
const { startOfDayInTimezone, endOfDayInTimezone, getDateStringInTimezone } = require('../../shared/date')

/**
 * Get partner timezone IANA (e.g. 'Asia/Karachi') for a device.
 * Uses the first site's country timezone for the device's partner.
 */
async function getPartnerTimezoneIANAForDevice(trx, deviceId) {
  const row = await trx('Device as d')
    .join('Site as s', 's.partnerId', 'd.partnerId')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .join('TimeZone as tz', 'c.timezone', 'tz.id')
    .where('d.id', deviceId)
    .first('tz.timeZone as timezoneIANA')
  return row ? row.timezoneIANA : null
}

function normalizeDeploymentDates(change, timezoneIANA) {
  const start = startOfDayInTimezone(change.start, timezoneIANA)
  const end = change.end ? endOfDayInTimezone(change.end, timezoneIANA) : null
  if (end && end < start) {
    throw Boom.conflict('Deployment end date cannot be before start date')
  }
  return { start, end }
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
  const now = new Date()

  await transact(async trx => {
    const timezoneIANA = await getPartnerTimezoneIANAForDevice(trx, deviceId)

    // Apply deletes
    const deletePromises = changes
      .filter(c => c.action === 'delete')
      .map(change => trx('Deployment').where('id', change.id).where('deviceId', deviceId).del())
    await Promise.all(deletePromises)

    // Apply updates (persist start/end as start/end of day in partner timezone, stored as UTC)
    const updatePromises = changes
      .filter(c => c.action === 'update')
      .map(change => {
        const { start, end } = normalizeDeploymentDates(change, timezoneIANA)
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
        const { start, end } = normalizeDeploymentDates(change, timezoneIANA)
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

    // Validate no overlaps in resulting deployment set (compare calendar dates in partner TZ so consecutive periods are valid)
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

      const currentEnd = new Date(current.end)
      const nextStart = new Date(next.start)
      const currentEndDateStr = getDateStringInTimezone(currentEnd, timezoneIANA)
      const nextStartDateStr = getDateStringInTimezone(nextStart, timezoneIANA)
      if (currentEndDateStr >= nextStartDateStr) {
        throw Boom.conflict('Deployment periods must not overlap')
      }
    }

    // Update Result.siteId for each deployment span (use DB values directly)
    const resultUpdatePromises = resultingDeployments.map(dep => {
      const query = trx('Result').where('deviceId', deviceId).where('endedOn', '>=', dep.start)
      if (dep.end) {
        query.where('endedOn', '<=', dep.end)
      }
      return query.update({ siteId: dep.siteId })
    })
    await Promise.all(resultUpdatePromises)

    // Set Result.siteId = NULL for results in gaps
    // Gap before first deployment
    if (resultingDeployments.length > 0) {
      const first = resultingDeployments[0]
      await trx('Result').where('deviceId', deviceId).where('endedOn', '<', first.start).update({ siteId: null })
    }

    // Gaps between deployments
    const gapPromises = []
    for (let i = 0; i < resultingDeployments.length - 1; i++) {
      const current = resultingDeployments[i]
      const next = resultingDeployments[i + 1]

      if (current.end) {
        const gapStart = new Date(current.end)
        gapStart.setUTCDate(gapStart.getUTCDate() + 1)
        gapStart.setUTCHours(0, 0, 0, 0)
        const gapEnd = new Date(next.start)
        gapEnd.setUTCDate(gapEnd.getUTCDate() - 1)
        gapEnd.setUTCHours(23, 59, 59, 999)

        if (gapStart <= gapEnd) {
          gapPromises.push(
            trx('Result')
              .where('deviceId', deviceId)
              .where('endedOn', '>=', gapStart)
              .where('endedOn', '<=', gapEnd)
              .update({ siteId: null })
          )
        }
      }
    }
    await Promise.all(gapPromises)

    // Gap after last deployment (if closed)
    if (resultingDeployments.length > 0) {
      const last = resultingDeployments[resultingDeployments.length - 1]
      if (last.end) {
        await trx('Result').where('deviceId', deviceId).where('endedOn', '>', last.end).update({ siteId: null })
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
