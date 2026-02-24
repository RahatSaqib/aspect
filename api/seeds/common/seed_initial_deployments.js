const { formatDateOrDefault, parseDateOrDefault } = require('../../src/shared/date')

/**
 * Infers deployment history from the Result table and creates one Deployment per
 * inferred period per device, so every Result matches a Deployment (by siteId and
 * endedOn within [start, end]). Assumes no existing Deployment rows. Only devices
 * that have results get deployments (device list is derived from the ranges).
 *
 * Uses aggregated (deviceId, siteId, minDate, maxDate) from Result so the query
 * stays small. Overlapping site ranges are split so that when a device was at site A,
 * then site B, then site A again, we get three deployments (A, B, A) with correct dates.
 *
 * Used by zz_shared, development, and test seeds.
 */

/** Normalize DB date (Date object or string) to YYYY-MM-DD. Returns null if invalid. */
function toDateOnly(val) {
  return formatDateOrDefault(val, 'yyyy-MM-dd', null)
}

/** Returns YYYY-MM-DD for the day after the given date (date-only string or Date). */
function addOneDay(dateStr) {
  const d = parseDateOrDefault(dateStr)
  if (!d) return null
  const next = new Date(d)
  next.setDate(next.getDate() + 1)
  return formatDateOrDefault(next, 'yyyy-MM-dd', null)
}

/** Returns YYYY-MM-DD for the day before the given date. */
function subtractOneDay(dateStr) {
  const d = parseDateOrDefault(dateStr)
  if (!d) return null
  const prev = new Date(d)
  prev.setDate(prev.getDate() - 1)
  return formatDateOrDefault(prev, 'yyyy-MM-dd', null)
}

/**
 * Builds deployment periods from per-site ranges. When ranges overlap (e.g. site 1
 * 2025-01-01..2026-02-20 and site 2 2025-06-15..2025-07-18), splits so we get
 * site 1 to 2025-06-14, site 2 2025-06-15..2025-07-18, site 1 from 2025-07-19.
 * Returns array of { siteId, startDate, endDate } in chronological order.
 */
function buildDeploymentPeriods(ranges) {
  if (ranges.length === 0) return []
  const boundaries = new Set()
  for (const r of ranges) {
    const next = addOneDay(r.maxDate)
    if (r.minDate) boundaries.add(r.minDate)
    if (next) boundaries.add(next)
  }
  const sorted = [...boundaries].filter(Boolean).sort()
  const segments = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const segStart = toDateOnly(sorted[i]) || sorted[i]
    const nextBound = toDateOnly(sorted[i + 1]) || sorted[i + 1]
    if (segStart && nextBound) {
      const segEnd = subtractOneDay(nextBound)
      if (segEnd) {
        let best = null
        for (const r of ranges) {
          if (r.minDate <= segStart && r.maxDate >= segEnd) {
            if (!best || r.minDate > best.minDate) best = r
          }
        }
        if (best) segments.push({ siteId: best.siteId, startDate: segStart, endDate: segEnd })
      }
    }
  }
  const merged = []
  for (const s of segments) {
    if (merged.length > 0 && merged[merged.length - 1].siteId === s.siteId) {
      merged[merged.length - 1].endDate = s.endDate
    } else {
      merged.push({ ...s })
    }
  }
  return merged
}

async function seedDeploymentPerDeviceAtSite(knex) {
  const ranges = await knex('Result')
    .whereNotNull(knex.raw('COALESCE(endedOn, startedOn)'))
    .select(
      'deviceId',
      'siteId',
      knex.raw('MIN(DATE(COALESCE(endedOn, startedOn))) as minDate'),
      knex.raw('MAX(DATE(COALESCE(endedOn, startedOn))) as maxDate')
    )
    .groupBy('deviceId', 'siteId')

  const byDevice = new Map()
  for (const r of ranges) {
    const minDate = toDateOnly(r.minDate)
    const maxDate = toDateOnly(r.maxDate)
    if (minDate && maxDate) {
      if (!byDevice.has(r.deviceId)) byDevice.set(r.deviceId, [])
      byDevice.get(r.deviceId).push({ siteId: r.siteId, minDate, maxDate })
    }
  }

  const deploymentRows = []
  for (const [deviceId, deviceRanges] of byDevice) {
    const periods = buildDeploymentPeriods(deviceRanges)
    for (let i = 0; i < periods.length; i++) {
      const p = periods[i]
      const isFirst = i === 0
      const isLast = i === periods.length - 1
      deploymentRows.push({
        deviceId,
        siteId: p.siteId,
        start: isFirst ? null : p.startDate,
        end: isLast ? null : p.endDate,
      })
    }
  }

  if (deploymentRows.length > 0) {
    await knex('Deployment').insert(deploymentRows)
  }
}

module.exports = { seedDeploymentPerDeviceAtSite }
