const { subDays } = require('date-fns')
const { toDateOnly } = require('../../src/shared/date')
/**
 * Infers deployment history from the Result table by walking each device's results in
 * local-time chronological order and creating a new Deployment whenever the result site changes.
 * Consecutive results from the same site are treated as a single deployment period.
 * If a device later returns to a previous site, that becomes a new deployment row.
 * Assumes no existing Deployment rows. Only devices that have results get deployments.
 *
 * Result.endedOn is stored in UTC; ordering and dates are computed in the device's timezone
 * (Device.timezone -> TimeZone.timeZone IANA) via CONVERT_TZ so the calendar date is correct for the device location.
 *
 * Used by zz_shared, development, and test seeds.
 */

async function seedDeploymentPerDeviceAtSite(knex) {
  const now = new Date()
  const deviceIds = await getDeviceIdsWithResults(knex)
  const deploymentRowsBatch = await deviceIds.reduce(async (pendingBatch, deviceId) => {
    const currentBatch = await pendingBatch
    const rows = await getOrderedResultRowsForDevice(knex, deviceId)
    currentBatch.push(...buildDeploymentRowsForDevice(deviceId, rows, now))

    if (currentBatch.length >= 1000) {
      await knex('Deployment').insert(currentBatch.splice(0, currentBatch.length))
    }

    return currentBatch
  }, Promise.resolve([]))

  if (deploymentRowsBatch.length > 0) {
    await knex('Deployment').insert(deploymentRowsBatch)
  }
}

async function getDeviceIdsWithResults(knex) {
  const rows = await knex('Result as r')
    .distinct('r.deviceId')
    .whereNotNull('r.endedOn')
    .whereNotNull('r.siteId')
    .orderBy('r.deviceId')

  return rows.map(row => row.deviceId)
}

async function getOrderedResultRowsForDevice(knex, deviceId) {
  const localEndedOn = 'CONVERT_TZ(r.endedOn, "+00:00", IFNULL(tz.timeZone, "Etc/UTC"))'

  return knex('Result as r')
    .join('Device as d', 'd.id', 'r.deviceId')
    .leftJoin('TimeZone as tz', 'tz.id', 'd.timezone')
    .where('r.deviceId', deviceId)
    .whereNotNull('r.endedOn')
    .whereNotNull('r.siteId')
    .select('r.id', 'r.siteId', knex.raw(`${localEndedOn} as localEndedOn`))
    .orderByRaw(`${localEndedOn} asc`)
}

function buildDeploymentRowsForDevice(deviceId, rows, now) {
  const siteStays = []

  for (const row of rows) {
    appendSiteStay(siteStays, row.siteId, row.localEndedOn)
  }

  return buildDeviceDeployments(deviceId, siteStays, now)
}

function appendSiteStay(siteStays, siteId, localEndedOn) {
  const localDate = toDateOnly(localEndedOn)
  const lastStay = siteStays[siteStays.length - 1]

  if (!lastStay) {
    siteStays.push({ siteId, startDate: localDate, endDate: localDate })
    return
  }

  if (lastStay.siteId === siteId) {
    lastStay.endDate = localDate
    return
  }

  // Deployment dates are day-based, so same-day site flips cannot be represented as separate rows.
  // Keep the latest site seen on that day.
  if (lastStay.startDate === localDate) {
    lastStay.siteId = siteId
    lastStay.endDate = localDate
    return
  }

  lastStay.endDate = toDateOnly(subDays(localEndedOn, 1))
  siteStays.push({ siteId, startDate: localDate, endDate: localDate })
}

function buildDeviceDeployments(deviceId, siteStays, now) {
  if (!deviceId || siteStays.length === 0) return []

  return siteStays.map((siteStay, index) => ({
    deviceId,
    siteId: siteStay.siteId,
    start: index === 0 ? null : siteStay.startDate,
    end: index === siteStays.length - 1 ? null : siteStay.endDate,
    createdOn: now,
    updatedOn: now,
  }))
}

module.exports = { seedDeploymentPerDeviceAtSite }
