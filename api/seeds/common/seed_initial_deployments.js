const { formatDateOrDefault, parseDateOrDefault, toDateOnly } = require('../../src/shared/date')

/**
 * Infers deployment history from the Result table: one Deployment per (deviceId, siteId)
 * using only the first result date at each site. Gaps are filled by extending each
 * deployment's end to the day before the next deployment's start (no empty periods).
 * When multiple sites share the same first-result date for a device, only one is kept
 * (the one with the latest endedOn / last result at that site) to satisfy the unique (deviceId, start) constraint.
 * Assumes no existing Deployment rows. Only devices that have results get deployments.
 *
 * Result.endedOn/startedOn are stored in UTC; dates are computed in the device's timezone
 * (Device.timezone -> TimeZone.timeZone IANA) via CONVERT_TZ so the calendar date is correct for the device location.
 *
 * Used by zz_shared, development, and test seeds.
 */

/** Returns YYYY-MM-DD for the day before the given date. */
function subtractOneDay(dateStr) {
  const d = parseDateOrDefault(dateStr)
  if (!d) return null
  const prev = new Date(d)
  prev.setDate(prev.getDate() - 1)
  return formatDateOrDefault(prev, 'yyyy-MM-dd', null)
}

async function seedDeploymentPerDeviceAtSite(knex) {
  const dateInDeviceTz = 'DATE(CONVERT_TZ(COALESCE(r.endedOn, r.startedOn), "+00:00", IFNULL(tz.timeZone, "Etc/UTC")))'
  const rows = await knex('Result as r')
    .join('Device as d', 'd.id', 'r.deviceId')
    .leftJoin('TimeZone as tz', 'tz.id', 'd.timezone')
    .whereNotNull(knex.raw('COALESCE(r.endedOn, r.startedOn)'))
    .select(
      'r.deviceId',
      'r.siteId',
      knex.raw(`MIN(${dateInDeviceTz}) as minDate`),
      knex.raw(`MAX(${dateInDeviceTz}) as maxDate`)
    )
    .groupBy('r.deviceId', 'r.siteId')

  const byDevice = new Map()
  for (const r of rows) {
    const minDate = toDateOnly(r.minDate)
    const maxDate = toDateOnly(r.maxDate)
    if (minDate) {
      if (!byDevice.has(r.deviceId)) byDevice.set(r.deviceId, [])
      byDevice.get(r.deviceId).push({ siteId: r.siteId, minDate, maxDate })
    }
  }

  const deploymentRows = []
  for (const [deviceId, stays] of byDevice) {
    // Sort by minDate then maxDate descending. Deduplicate by minDate: unique (deviceId, start)
    // allows only one per start date; when multiple sites share the same minDate we keep the one
    // with the latest endedOn (last result at that site).
    const sorted = [...stays].sort((a, b) => {
      const d = a.minDate.localeCompare(b.minDate)
      if (d !== 0) return d
      return (b.maxDate || '').localeCompare(a.maxDate || '')
    })
    const byMinDate = []
    for (const s of sorted) {
      if (byMinDate.length === 0 || byMinDate[byMinDate.length - 1].minDate !== s.minDate) {
        byMinDate.push({ siteId: s.siteId, minDate: s.minDate })
      }
    }
    for (let i = 0; i < byMinDate.length; i++) {
      const s = byMinDate[i]
      const isFirst = i === 0
      const isLast = i === byMinDate.length - 1
      const nextStart = isLast ? null : byMinDate[i + 1].minDate
      deploymentRows.push({
        deviceId,
        siteId: s.siteId,
        start: isFirst ? null : s.minDate,
        end: isLast ? null : subtractOneDay(nextStart),
      })
    }
  }

  if (deploymentRows.length > 0) {
    await knex('Deployment').insert(deploymentRows)
  }
}

module.exports = { seedDeploymentPerDeviceAtSite }
