const Boom = require('@hapi/boom')
const { knex } = require('../../../db')

/**
 * Assigns a mobile device spot to a device code
 * Priority:
 *   1) Unassigned spots
 *   2) Oldest inactive spot
 *   3) Oldest active spot > 3 months without sending samples
 *   4) Oldest active spot > 3 months from assignment wihtout any sample created
 * Ensures concurrency safety
 * @param {string} deviceCode - The device code to look up
 * @param {number} userId - The userId for updating records
 * @returns {Promise<Object>} - Response containing the App Spot or error
 */
async function assignMobileAppSpot(deviceCode, userId) {
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

    const availableSpot = await findFirstAvailableSpot(trx, deviceCode)

    if (!availableSpot || availableSpot.priority > 4) {
      // If priority > 4 => The best candidate is active.
      throw Boom.conflict('All mobile spots are assigned.')
    }

    const assignmentData = {
      deviceCode,
      active: true,
      updatedBy: userId,
      updatedOn: new Date(),
    }

    if (!availableSpot.createdOn) {
      assignmentData.createdBy = userId
      assignmentData.createdOn = new Date()
    }

    await updateMobileDevice(trx, availableSpot.id, assignmentData)

    return {
      appId: availableSpot.deviceAppSpot,
    }
  })
}

/**
 * Finds the first available mobile device record with priority-based selection
 * Excludes records where deviceAppSpot has been used in Sample records created today
 * Uses SELECT FOR UPDATE to ensure concurrency safety
 * @param {Object} trx - Database transaction
 * @param {string} deviceCode - The device code to exclude
 * @returns {Promise<Object|null>} Available record or null if none found
 */
async function findFirstAvailableSpot(trx, deviceCode) {
  return trx('MobileDevice as md')
    .leftJoin('Sample as recentSamples', function () {
      this.on('md.deviceAppSpot', knex.raw('SUBSTRING(recentSamples.externalId, 1, 3)'))
        .andOn('recentSamples.createdOn', '>=', knex.raw(`DATE_SUB(NOW(), INTERVAL 2 DAY)`))
        .andOn('recentSamples.externalId', 'regexp', knex.raw("'^\\\\d{3}-\\\\d{6}-\\\\d{3}$'"))
    })
    .leftJoin(
      trx('Sample as ls')
        .select(knex.raw('SUBSTRING(ls.externalId, 1, 3) as deviceAppSpot'), knex.raw('MAX(ls.createdOn) as createdOn'))
        .where('ls.externalId', 'regexp', knex.raw("'^\\\\d{3}-\\\\d{6}-\\\\d{3}$'"))
        .groupBy(knex.raw('SUBSTRING(ls.externalId, 1, 3)'))
        .as('lastSample'),
      function () {
        this.on('md.deviceAppSpot', 'lastSample.deviceAppSpot').andOn('lastSample.createdOn', '>', 'md.updatedOn') // the spot could have a previous assignment, let's skip any sample generated in a previous assignment..
      }
    )
    .whereNull('recentSamples.id') // Exclude spots used in today's samples to avoid repetitions in case of a reinstallation of the app
    .modify(qb => {
      if (deviceCode) {
        qb.where(function () {
          this.whereNull('md.deviceCode').orWhereNot('md.deviceCode', deviceCode)
        })
      }
    })
    .select(
      'md.id',
      'md.deviceAppSpot',
      'md.deviceCode',
      'md.active',
      'md.createdOn',
      'md.createdBy',
      'md.updatedOn',
      'md.updatedBy',
      knex.raw(
        `CASE
    WHEN md.deviceCode IS NULL THEN 1
    WHEN md.active = false THEN 2
    WHEN lastSample.deviceAppSpot is not null and lastSample.createdOn < DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 3
    WHEN lastSample.deviceAppSpot is null and md.updatedOn < DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 4
    ELSE 10
  END as priority`
      )
    )
    .orderBy('priority', 'asc')
    .orderBy('md.updatedOn', 'asc') // Oldest first within same priority
    .orderBy('md.deviceAppSpot', 'asc')
    .forUpdate() // Lock the row for update to prevent race conditions
    .first()
}

const findExistingAssignment = async (trx, deviceCode) =>
  trx('MobileDevice').where('deviceCode', deviceCode).where('active', true).first().forUpdate()

const updateMobileDevice = async (trx, id, data) => trx('MobileDevice').where('id', id).update(data)

module.exports = {
  assignMobileAppSpot,
}
