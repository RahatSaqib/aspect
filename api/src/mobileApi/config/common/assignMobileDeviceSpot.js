const Boom = require('@hapi/boom')
const { knex } = require('../../../db')

/**
 * Assigns a mobile device spot to a device code
 * Priority: 1) Unassigned records, 2) Oldest inactive records, 3) Oldest active records > 3 months
 * Uses SELECT FOR UPDATE to ensure concurrency safety
 * @param {string} deviceCode - The device code to look up
 * @param {number} userId - The user ID for updating records
 * @returns {Promise<Object>} Response containing the appId or error
 */
async function assignMobileDeviceSpot(deviceCode, userId) {
  if (!deviceCode || typeof deviceCode !== 'string') {
    throw new Error('Invalid device code provided')
  }

  return knex.transaction(async trx => {
    // Check if deviceCode is already assigned
    const existingAssignment = await trx('MobileDevice').where('deviceCode', deviceCode).first()

    if (existingAssignment) {
      // Set current assignment as inactive
      await trx('MobileDevice').where('id', existingAssignment.id).update({
        active: false,
        updatedBy: userId,
        updatedOn: new Date(),
      })
    }

    // Find first available record with priority order using SELECT FOR UPDATE
    // Exclude records where deviceIdentifier has been used in Sample records created today
    const availableRecord = await trx('MobileDevice')
      .leftJoin('Sample', function () {
        this.on('MobileDevice.deviceIdentifier', trx.raw('SUBSTRING(Sample.externalId, 1, 3)'))
          .andOn('Sample.createdOn', '>=', trx.raw('DATE(NOW())'))
          .andOn('Sample.externalId', 'regexp', '^\\d{3}-\\d{6}-\\d{3}$')
      })
      .whereNull('Sample.id') // Exclude records used in today's samples
      .select(
        'MobileDevice.*',
        trx
          .raw(
            `CASE
    WHEN MobileDevice.deviceCode IS NULL THEN 1
    WHEN MobileDevice.active = false THEN 2
    WHEN MobileDevice.active = true AND MobileDevice.updatedOn < DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 3
    ELSE 4
  END as priority`
          )
          .first()
      )
      .orderBy('priority', 'asc')
      .orderBy('MobileDevice.updatedOn', 'asc') // Oldest first within same priority
      .forUpdate() // Lock the row for update to prevent race conditions

    if (!availableRecord) {
      throw Boom.conflict('All mobile spots are assigned.')
    }

    // Assign the record to the deviceCode
    const auditoryData = {
      deviceCode,
      active: true,
      updatedBy: userId,
      updatedOn: new Date(),
    }

    // Only set createdBy and createdOn if they are null (new assignment)
    if (!availableRecord.createdBy) {
      auditoryData.createdBy = userId
    }
    if (!availableRecord.createdOn) {
      auditoryData.createdOn = new Date()
    }

    await trx('MobileDevice').where('id', availableRecord.id).update(auditoryData)

    return {
      appId: availableRecord.deviceIdentifier,
    }
  })
}

module.exports = {
  assignMobileDeviceSpot,
}
