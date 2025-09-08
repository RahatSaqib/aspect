const { knex } = require('../../../db')

/**
 * Assigns a mobile device spot to a device code
 * Priority: 1) Unassigned records, 2) Oldest inactive records, 3) Oldest active records > 3 months
 * @param {string} deviceCode - The device code to look up
 * @param {number} userId - The user ID for updating records
 * @returns {Promise<Object>} Response containing the appId or error
 */
async function assignMobileDeviceSpot(deviceCode, userId) {
  if (!deviceCode || typeof deviceCode !== 'string') {
    throw new Error('Invalid device code provided')
  }

  // Check if deviceCode is already assigned
  const existingAssignment = await knex('MobileDevice')
    .where('deviceCode', deviceCode)
    .first()

  if (existingAssignment) {
    // Set current assignment as inactive
    await knex('MobileDevice')
      .where('id', existingAssignment.id)
      .update({
        active: false,
        updatedBy: userId,
        updatedOn: new Date()
      })
  }

  // Find first available record with priority order
  const availableRecord = await knex('MobileDevice')
    .where(function () {
      // Unassigned records (no deviceCode)
      this.whereNull('deviceCode')
        .orWhere(function () {
          // Inactive records (active = false)
          this.where('active', false)
        })
        .orWhere(function () {
          // Active records older than 3 months
          this.where('active', true)
            .where('updatedOn', '<', knex.raw('DATE_SUB(NOW(), INTERVAL 3 MONTH)'))
        })
    })
    .orderBy([
      { column: 'deviceCode', order: 'asc', nulls: 'first' }, // Unassigned first
      { column: 'active', order: 'asc' }, // Inactive before active
      { column: 'updatedOn', order: 'asc' } // Oldest first
    ])
    .first()

  if (!availableRecord) {
    throw new Error('All mobile spots are assigned.')
  }

  // Assign the record to the deviceCode
  await knex('MobileDevice')
    .where('id', availableRecord.id)
    .update({
      deviceCode,
      active: true,
      createdBy: userId,
      createdOn: new Date(),
      updatedBy: userId,
      updatedOn: new Date()
    })

  return {
    appId: availableRecord.deviceIdentifier
  }
}

module.exports = {
  assignMobileDeviceSpot
}
