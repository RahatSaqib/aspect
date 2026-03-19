/**
 * Migrate device approval statuses from 4 (provisioned, assigned, approved, decommissioned)
 * to 3 (pendingDeployment, approved, decommissioned).
 *
 * Maps existing provisioned/assigned devices and logs to pendingDeployment,
 * then removes the old rows.
 */
async function seed(knex) {
  await knex.transaction(async trx => {
    // 1. Upsert the pendingDeployment row
    const existing = await trx('DeviceApproval').where('token', 'pendingDeployment').first()
    let pendingDeploymentId
    if (existing) {
      pendingDeploymentId = existing.id
      await trx('DeviceApproval').where('id', existing.id).update({
        name: 'PendingDeployment',
        i18nKey: 'deviceApprovalPendingDeployment',
      })
    } else {
      ;[pendingDeploymentId] = await trx('DeviceApproval').insert({
        name: 'PendingDeployment',
        token: 'pendingDeployment',
        i18nKey: 'deviceApprovalPendingDeployment',
      })
    }

    // 2. Get the ids for provisioned and assigned (if they still exist)
    const oldStatuses = await trx('DeviceApproval').whereIn('token', ['provisioned', 'assigned']).select('id', 'token')
    const oldIds = oldStatuses.map(s => s.id)

    if (oldIds.length > 0) {
      // 3. Remap Device rows
      await trx('Device').whereIn('deviceApprovalId', oldIds).update({ deviceApprovalId: pendingDeploymentId })

      // 4. Remap DeviceApprovalLog rows
      await trx('DeviceApprovalLog')
        .whereIn('deviceApprovalId', oldIds)
        .update({ deviceApprovalId: pendingDeploymentId })

      // 5. Delete the old provisioned and assigned rows
      await trx('DeviceApproval').whereIn('id', oldIds).delete()
    }

    // Keep Device.instrumentsConnected in sync with Instrument links
    const instrumentCountsByDeviceQuery = trx('Instrument as i')
      .select('i.deviceId')
      .count({ cnt: '*' })
      .groupBy('i.deviceId')
      .as('ic')

    await trx('Device as d')
      .leftJoin(instrumentCountsByDeviceQuery, 'ic.deviceId', 'd.id')
      .update({
        instrumentsConnected: trx.raw('IFNULL(ic.cnt, 0)'),
      })
  })
}

module.exports = require('../utils').seed(seed, __filename)
