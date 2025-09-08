const Boom = require('@hapi/boom')
const { knex } = require('../../../db')
const { getDateTimeExpressionInTimeZone } = require('../../../shared/date')

/**
 * Assigns a mobile device spot to a device code
 * Priority: 1) Unassigned records, 2) Oldest inactive records, 3) Oldest active records > 3 months without sending samples
 * Ensures concurrency safety
 * @param {string} deviceCode - The device code to look up
 * @param {number} userId - The user ID for updating records
 * @param {string} timezoneIANA - The user's timezone for proper date filtering
 * @returns {Promise<Object>} Response containing the appId or error
 */
async function assignMobileAppSpot(deviceCode, userId, timezoneIANA) {
  if (!deviceCode) {
    throw new Error('Missing device code')
  }

  return knex.transaction(async trx => {
    // Check if deviceCode is already assigned and deactivate it
    const existingAssignment = await findExistingAssignment(trx, deviceCode)
    if (existingAssignment) {
      await updateMobileDevice(trx, existingAssignment.id, {
        active: false,
        updatedBy: userId,
        updatedOn: new Date(),
      })
    }

    // Find the first available record with priority-based selection
    const availableRecord = await findFirstAvailableRecord(trx, timezoneIANA)

    if (!availableRecord) {
      throw Boom.conflict('All mobile spots are assigned.')
    }

    const assignmentData = {
      deviceCode,
      active: true,
      updatedBy: userId,
      updatedOn: new Date(),
    }

    if (!availableRecord.createdBy) {
      assignmentData.createdBy = userId
    }
    if (!availableRecord.createdOn) {
      assignmentData.createdOn = new Date()
    }

    await updateMobileDevice(trx, availableRecord.id, assignmentData)

    return {
      appId: availableRecord.deviceIdentifier,
    }
  })
}

/**
 * Finds the first available mobile device record with priority-based selection
 * Excludes records where deviceIdentifier has been used in Sample records created today
 * Uses SELECT FOR UPDATE to ensure concurrency safety
 * @param {Object} trx - Database transaction
 * @param {string} timezoneIANA - The user's timezone for proper date filtering
 * @returns {Promise<Object|null>} Available record or null if none found
 */
async function findFirstAvailableRecord(trx, timezoneIANA) {
  return trx('MobileDevice as md')
    .leftJoin('Sample as s', function () {
      this.on('md.deviceIdentifier', trx.raw('SUBSTRING(s.externalId, 1, 3)'))
        .andOn('s.createdOn', '>=', trx.raw(`DATE(${getDateTimeExpressionInTimeZone(trx, 'NOW()', timezoneIANA)})`))
        .andOn('s.externalId', 'regexp', '^\\d{3}-\\d{6}-\\d{3}$')
    })
    .whereNull('s.id') // Exclude records used in today's samples to avoid repeatitions in a reinstallation of the app
    .select(
      'md.id',
      'md.deviceIdentifier',
      'md.deviceCode',
      'md.active',
      'md.createdOn',
      'md.createdBy',
      'md.updatedOn',
      'md.updatedBy',
      trx.raw(
        `CASE
    WHEN md.deviceCode IS NULL THEN 1
    WHEN md.active = false THEN 2
    WHEN md.active = true AND md.updatedOn < DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 3
    ELSE 4
  END as priority`
      )
    )
    .orderBy('priority', 'asc')
    .orderBy('md.updatedOn', 'asc') // Oldest first within same priority
    .forUpdate() // Lock the row for update to prevent race conditions
    .first()
}

const findExistingAssignment = async (trx, deviceCode) =>
  trx('MobileDevice').where('deviceCode', deviceCode).first().forUpdate()

const updateMobileDevice = async (trx, id, data) => trx('MobileDevice').where('id', id).update(data)

module.exports = {
  assignMobileAppSpot,
}
