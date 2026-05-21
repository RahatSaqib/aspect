const Boom = require('@hapi/boom')
const { addDays, format } = require('date-fns')
const { transact } = require('../../db')
const { getUserFromCredentials } = require('../../auth/constraints')
const { recalculateDeviceFactTables } = require('../common/logic')
const {
  assertDeviceIsNotDecommissioned,
  syncDeviceApprovalFromDeployments,
} = require('../common/deviceApprovalService')
const { toDateOnly } = require('../../shared/date')
const { resultSiteAssigned } = require('../../result/actions')

function normalizeDeploymentDates(change) {
  const start = change.start != null ? toDateOnly(change.start) : null
  const end = change.end != null ? toDateOnly(change.end) : null
  if (start && end && end < start) {
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
  const timezoneIANA = user?.timezoneIANA ?? user?.personTimezoneIANA ?? 'Etc/UTC'
  const now = new Date()
  const hasAddedActiveDeployment = changes.some(change => {
    if (change.action !== 'add') {
      return false
    }

    return normalizeDeploymentDates(change).end === null
  })

  let resultIdsToRelink = []

  await transact(async trx => {
    await assertDeviceIsNotDecommissioned(trx, deviceId)

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
      await trx('Device').where('id', deviceId).update({ siteId: null, updatedOn: now, updatedBy: user.id })
      await syncDeviceApprovalFromDeployments(trx, { deviceId, userId: user.id, now })
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

    // Capture only results whose site is actually changing, and only when a
    // pending FormData row already exists for the target site+sample pair.
    // This avoids dispatching events for unchanged rows or rows that cannot link.
    resultIdsToRelink = await collectUnassignedResultIdsInSpans(trx, deviceId, resultingDeployments, timezoneIANA)

    // Update Sample.originSiteId to deployment site only when no result from another device points to the same sample
    await updateSampleOriginSiteId(resultingDeployments, trx, deviceId, timezoneIANA)
    // Update Result.siteId for each deployment span (result date in user timezone)
    await updateResultSites(trx, timezoneIANA, resultingDeployments, deviceId)

    // Sync Device.siteId with the active deployment
    const activeDeployment = resultingDeployments.find(d => d.end === null)
    await trx('Device')
      .where('id', deviceId)
      .update({ siteId: activeDeployment?.siteId ?? null, updatedOn: now, updatedBy: user.id })

    await syncDeviceApprovalFromDeployments(trx, { deviceId, userId: user.id, now })

    if (!hasAddedActiveDeployment) {
      return
    }

    const device = await trx('Device').where('id', deviceId).first('deviceApiKeyId')
    if (!device?.deviceApiKeyId) {
      return
    }

    const [{ cnt: deviceCount }] = await trx('Device').where('deviceApiKeyId', device.deviceApiKeyId).count('id as cnt')

    await trx('DeviceApiKey')
      .where('id', device.deviceApiKeyId)
      .update({ siteId: Number(deviceCount) === 1 ? activeDeployment?.siteId ?? null : null })
  })

  await recalculateDeviceFactTables(messageContext, [parseInt(deviceId, 10)])

  if (resultIdsToRelink.length > 0) {
    const ctx = messageContext.bindActionCreators({ resultSiteAssigned })
    for (const rid of resultIdsToRelink) {
      ctx.resultSiteAssigned(rid)
    }
  }

  return { ok: true }
}

module.exports = { persistDeploymentChanges }
async function updateResultSites(trx, timezoneIANA, resultingDeployments, deviceId) {
  const resultUpdatePromises = resultingDeployments.map(dep => {
    // Subquery that captures the old siteId per result within this deployment span
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

    // Single UPDATE per span, using the captured oldSiteId
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

    return (
      trx('Sample as s')
        .whereIn('s.id', sampleIdsInSpanQuery)
        // Only update samples whose current originSiteId matches the Result.siteId before the change
        .whereExists(
          trx('Result as r3')
            .select(trx.raw('1'))
            .whereRaw('r3.sampleId = s.id')
            .where('r3.deviceId', deviceId)
            .whereRaw('r3.siteId = s.originSiteId')
        )
        .whereNotExists(
          // Skip if sample was also used in another device.
          trx('Result as r2').select(trx.raw(1)).whereRaw('r2.sampleId = s.id').where('r2.deviceId', '!=', deviceId)
        )
        .update({ originSiteId: dep.siteId })
    )
  })
  await Promise.all(sampleUpdatePromises)
}
