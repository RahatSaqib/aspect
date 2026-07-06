const Boom = require('@hapi/boom')
const { addDays, format, parseISO } = require('date-fns')
const { formatInTimeZone } = require('date-fns-tz')
const { toDateOnly } = require('../../shared/date')
const { syncDeviceApprovalFromDeployments } = require('../common/deviceApprovalService')

function normalizeDeploymentDates(change) {
  const start = change.start != null ? toDateOnly(change.start) : null
  const end = change.end != null ? toDateOnly(change.end) : null
  if (start && end && end < start) {
    throw Boom.conflict('Deployment end date cannot be before start date')
  }
  return { start, end }
}

async function getDeploymentsHistory(trx, deviceId) {
  return trx('Deployment')
    .where('deviceId', deviceId)
    .orderByRaw('start IS NULL DESC, start ASC')
    .select('id', 'siteId', 'start', 'end')
}

function assertContinuousDeploymentTimeline(resultingDeployments) {
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

  for (let i = 0; i < resultingDeployments.length - 1; i++) {
    const current = resultingDeployments[i]
    const next = resultingDeployments[i + 1]
    if (!current.end) {
      throw Boom.conflict('Only the last deployment may be active (have no end date)')
    }
    const expectedNextStart = format(addDays(current.end, 1), 'yyyy-MM-dd')
    if (toDateOnly(next.start) !== expectedNextStart) {
      throw Boom.conflict('Deployments must form a continuous timeline with no gaps or overlaps')
    }
  }
}

async function applyDeploymentChanges(trx, { deviceId, changes, userId, now }) {
  const deletePromises = changes
    .filter(c => c.action === 'delete')
    .map(change => trx('Deployment').where('id', change.id).where('deviceId', deviceId).del())
  await Promise.all(deletePromises)

  const updatePromises = changes
    .filter(c => c.action === 'update')
    .map(change => {
      const { start, end } = normalizeDeploymentDates(change)
      return trx('Deployment').where('id', change.id).where('deviceId', deviceId).update({
        siteId: change.siteId,
        start,
        end,
        updatedOn: now,
        updatedBy: userId,
      })
    })
  await Promise.all(updatePromises)

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
        createdBy: userId,
        updatedOn: now,
        updatedBy: userId,
      })
    })
  await Promise.all(insertPromises)
}

async function clearUndeployedDevice(trx, { deviceId, userId, now }) {
  await trx('Result').where('deviceId', deviceId).update({ siteId: null })
  await trx('Device').where('id', deviceId).update({ siteId: null, updatedOn: now, updatedBy: userId })
  await syncDeviceApprovalFromDeployments(trx, { deviceId, userId, now })
}

async function syncDeviceSiteFromDeployments(trx, { deviceId, userId, now, resultingDeployments }) {
  const activeDeployment = resultingDeployments.find(d => d.end === null)
  await trx('Device')
    .where('id', deviceId)
    .update({ siteId: activeDeployment?.siteId ?? null, updatedOn: now, updatedBy: userId })
}

async function updateDeviceApiKeySiteForActiveDeployment(trx, { deviceId, activeDeployment }) {
  const device = await trx('Device').where('id', deviceId).first('deviceApiKeyId')
  if (!device?.deviceApiKeyId) {
    return
  }

  const [{ cnt: deviceCount }] = await trx('Device').where('deviceApiKeyId', device.deviceApiKeyId).count('id as cnt')

  await trx('DeviceApiKey')
    .where('id', device.deviceApiKeyId)
    .update({ siteId: Number(deviceCount) === 1 ? activeDeployment?.siteId ?? null : null })
}

async function applyDeploymentSiteSideEffects(trx, { deviceId, timezoneIANA, resultingDeployments }) {
  const resultIdsToRelink = await collectUnassignedResultIdsInSpans(trx, deviceId, resultingDeployments, timezoneIANA)
  await updateSampleOriginSiteId(resultingDeployments, trx, deviceId, timezoneIANA)
  await updateResultSites(trx, timezoneIANA, resultingDeployments, deviceId)
  return resultIdsToRelink
}

async function finalizeDeploymentTimeline(trx, { deviceId, userId, now, timezoneIANA, hasAddedActiveDeployment }) {
  const resultingDeployments = await getDeploymentsHistory(trx, deviceId)

  if (resultingDeployments.length === 0) {
    await clearUndeployedDevice(trx, { deviceId, userId, now })
    return { resultIdsToRelink: [] }
  }

  assertContinuousDeploymentTimeline(resultingDeployments)

  const resultIdsToRelink = await applyDeploymentSiteSideEffects(trx, {
    deviceId,
    timezoneIANA,
    resultingDeployments,
  })

  await syncDeviceSiteFromDeployments(trx, { deviceId, userId, now, resultingDeployments })
  await syncDeviceApprovalFromDeployments(trx, { deviceId, userId, now })

  if (hasAddedActiveDeployment) {
    const activeDeployment = resultingDeployments.find(d => d.end === null)
    await updateDeviceApiKeySiteForActiveDeployment(trx, { deviceId, activeDeployment })
  }

  return { resultIdsToRelink }
}

async function updateDeployment(trx, { deviceId, siteId, userId, now, timezoneIANA }) {
  const deployments = await getDeploymentsHistory(trx, deviceId)

  if (deployments.length === 0) {
    throw Boom.conflict('Device has no deployments to reactivate')
  }

  const activeDeployment = deployments.find(d => d.end === null)
  if (!activeDeployment) {
    throw Boom.conflict('Device has no active deployment')
  }

  const today = formatInTimeZone(now, timezoneIANA, 'yyyy-MM-dd')
  const previousDay = format(addDays(parseISO(today), -1), 'yyyy-MM-dd')
  const activeStart = activeDeployment.start != null ? toDateOnly(activeDeployment.start) : null

  if (activeStart && activeStart > previousDay) {
    throw Boom.conflict('Cannot reactivate: deployment timeline conflict')
  }

  await trx('Deployment').where('id', activeDeployment.id).update({
    end: previousDay,
    updatedOn: now,
    updatedBy: userId,
  })

  await trx('Deployment').insert({
    deviceId,
    siteId,
    start: today,
    end: null,
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  })

  const resultingDeployments = await getDeploymentsHistory(trx, deviceId)
  assertContinuousDeploymentTimeline(resultingDeployments)
  await applyDeploymentSiteSideEffects(trx, { deviceId, timezoneIANA, resultingDeployments })
  await syncDeviceSiteFromDeployments(trx, { deviceId, userId, now, resultingDeployments })

  return resultingDeployments
}

async function updateResultSites(trx, timezoneIANA, resultingDeployments, deviceId) {
  const resultUpdatePromises = resultingDeployments.map(dep => {
    const spanResultsSubquery = trx('Result as r2')
      .where('r2.deviceId', deviceId)
      .modify(qb => {
        if (dep.start !== null) {
          qb.whereRaw('DATE(CONVERT_TZ(r2.endedOn, "+00:00", ?)) >= ?', [timezoneIANA, dep.start])
        }
        if (dep.end !== null) {
          qb.whereRaw('DATE(CONVERT_TZ(r2.endedOn, "+00:00", ?)) <= ?', [timezoneIANA, dep.end])
        }
      })
      .select('r2.id', 'r2.siteId as oldSiteId')

    return trx('Result as r')
      .join(spanResultsSubquery.as('x'), 'x.id', 'r.id')
      .where('r.deviceId', deviceId)
      .update({
        siteId: dep.siteId,
        reportableSiteId: trx.raw('IF(r.reportableSiteId = x.oldSiteId, ?, r.reportableSiteId)', [dep.siteId]),
        referringSiteId: trx.raw(
          'IF(r.referringSiteId IS NOT NULL AND r.referringSiteId = x.oldSiteId, ?, r.referringSiteId)',
          [dep.siteId]
        ),
      })
  })

  await Promise.all(resultUpdatePromises)
}

async function collectUnassignedResultIdsInSpans(trx, deviceId, resultingDeployments, timezoneIANA) {
  const perSpanQueries = resultingDeployments.map(dep => {
    if (!dep.siteId) {
      return Promise.resolve([])
    }
    return trx('Result as r')
      .join('Sample as s', 's.id', 'r.sampleId')
      .where('r.deviceId', deviceId)
      .where(qb => {
        qb.whereNull('r.siteId').orWhere('r.siteId', '!=', dep.siteId)
      })
      .whereNotNull('s.externalId')
      .whereRaw('TRIM(s.externalId) != ""')
      .whereExists(
        trx('FormData as fd')
          .select(trx.raw('1'))
          .where('fd.siteId', dep.siteId)
          .whereNull('fd.resultId')
          .whereRaw('fd.sampleExternalId = TRIM(s.externalId)')
      )
      .modify(qb => {
        if (dep.start !== null) {
          qb.whereRaw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) >= ?', [timezoneIANA, dep.start])
        }
        if (dep.end !== null) {
          qb.whereRaw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) <= ?', [timezoneIANA, dep.end])
        }
      })
      .pluck('r.id')
  })
  const idsPerSpan = await Promise.all(perSpanQueries)
  const seen = new Set()
  const result = []
  for (const ids of idsPerSpan) {
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id)
        result.push(id)
      }
    }
  }
  return result
}

async function updateSampleOriginSiteId(resultingDeployments, trx, deviceId, timezoneIANA) {
  const sampleUpdatePromises = resultingDeployments.map(dep => {
    const sampleIdsInSpanQuery = trx('Result as r')
      .where('r.deviceId', deviceId)
      .whereNotNull('r.sampleId')
      .select('r.sampleId')
    if (dep.start !== null) {
      sampleIdsInSpanQuery.whereRaw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) >= ?', [timezoneIANA, dep.start])
    }
    if (dep.end !== null) {
      sampleIdsInSpanQuery.whereRaw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) <= ?', [timezoneIANA, dep.end])
    }

    return trx('Sample as s')
      .whereIn('s.id', sampleIdsInSpanQuery)
      .whereExists(
        trx('Result as r3')
          .select(trx.raw('1'))
          .whereRaw('r3.sampleId = s.id')
          .where('r3.deviceId', deviceId)
          .whereRaw('r3.siteId = s.originSiteId')
      )
      .whereNotExists(
        trx('Result as r2').select(trx.raw(1)).whereRaw('r2.sampleId = s.id').where('r2.deviceId', '!=', deviceId)
      )
      .update({ originSiteId: dep.siteId })
  })
  await Promise.all(sampleUpdatePromises)
}

module.exports = {
  applyDeploymentChanges,
  applyDeploymentSiteSideEffects,
  assertContinuousDeploymentTimeline,
  updateDeployment,
  collectUnassignedResultIdsInSpans,
  finalizeDeploymentTimeline,
  getDeploymentsHistory,
  normalizeDeploymentDates,
  updateResultSites,
  updateSampleOriginSiteId,
}
