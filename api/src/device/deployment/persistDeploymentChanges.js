const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')
const { getConstraints, getUserFromCredentials } = require('../../auth/constraints')
const { recalculateDeviceFactTables } = require('../common/logic')

async function persistDeploymentChanges(request) {
  const {
    params,
    auth,
    payload,
    plugins: { messageContext },
  } = request
  const { deviceId } = params
  const { changes } = payload
  const dataConstraints = await getConstraints(auth.credentials)
  const user = await getUserFromCredentials(auth.credentials)
  const now = new Date()

  await transact(async trx => {
    // Apply deletes
    for (const change of changes.filter(c => c.action === 'delete')) {
      await trx('Deployment').where('id', change.id).where('deviceId', deviceId).del()
    }

    // Apply updates
    for (const change of changes.filter(c => c.action === 'update')) {
      await trx('Deployment')
        .where('id', change.id)
        .where('deviceId', deviceId)
        .update({
          siteId: change.siteId,
          start: change.start,
          end: change.end || null,
          updatedOn: now,
          updatedBy: user.id,
        })
    }

    // Apply inserts
    for (const change of changes.filter(c => c.action === 'add')) {
      await trx('Deployment').insert({
        deviceId,
        siteId: change.siteId,
        start: change.start,
        end: change.end || null,
        createdOn: now,
        createdBy: user.id,
        updatedOn: now,
        updatedBy: user.id,
      })
    }

    // Validate no overlaps in resulting deployment set
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
      if (currentEnd >= nextStart) {
        throw Boom.conflict('Deployment periods must not overlap')
      }
    }

    // Update Result.siteId for each deployment span
    for (const dep of resultingDeployments) {
      const query = trx('Result')
        .where('deviceId', deviceId)
        .where(knex.raw('DATE(endedOn) >= DATE(?)', [dep.start]))

      if (dep.end) {
        query.where(knex.raw('DATE(endedOn) <= DATE(?)', [dep.end]))
      }

      await query.update({ siteId: dep.siteId })
    }

    // Set Result.siteId = NULL for results in gaps
    // Gap before first deployment
    if (resultingDeployments.length > 0) {
      const first = resultingDeployments[0]
      await trx('Result')
        .where('deviceId', deviceId)
        .where(knex.raw('DATE(endedOn) < DATE(?)', [first.start]))
        .update({ siteId: null })
    }

    // Gaps between deployments
    for (let i = 0; i < resultingDeployments.length - 1; i++) {
      const current = resultingDeployments[i]
      const next = resultingDeployments[i + 1]

      if (!current.end) continue

      const gapStart = new Date(current.end)
      gapStart.setDate(gapStart.getDate() + 1)
      const gapEnd = new Date(next.start)
      gapEnd.setDate(gapEnd.getDate() - 1)

      if (gapStart > gapEnd) continue

      await trx('Result')
        .where('deviceId', deviceId)
        .where(knex.raw('DATE(endedOn) >= DATE(?)', [gapStart]))
        .where(knex.raw('DATE(endedOn) <= DATE(?)', [gapEnd]))
        .update({ siteId: null })
    }

    // Gap after last deployment (if closed)
    if (resultingDeployments.length > 0) {
      const last = resultingDeployments[resultingDeployments.length - 1]
      if (last.end) {
        await trx('Result')
          .where('deviceId', deviceId)
          .where(knex.raw('DATE(endedOn) > DATE(?)', [last.end]))
          .update({ siteId: null })
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
