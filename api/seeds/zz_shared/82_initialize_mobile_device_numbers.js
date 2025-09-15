module.exports = require('../utils').seed(async knex => {
  // Generate all possible 3-digit numbers (000-999)
  const mobileDevices = Array.from({ length: 1000 }, (_, i) => ({
    deviceAppSpot: i.toString().padStart(3, '0'),
    active: false, // Initially inactive until assigned to a real device
  }))

  await knex('MobileDevice').insert(mobileDevices)

  // Populate used records from existing Sample data
  await populateUsedRecordsFromSamples(knex)
}, __filename)

/**
 * Populates MobileDevice table with used records from existing Sample data
 * @param {Object} knex - Knex instance
 */
async function populateUsedRecordsFromSamples(knex) {
  // Get used device identifiers from Sample externalId matching pattern \d{3}-\d{6}-\d{3}
  const usedRecords = await knex('Sample as s')
    .select(
      knex.raw('SUBSTRING(s.externalId, 1, 3) as deviceAppSpot'),
      knex.raw('MIN(s.createdOn) as firstUsedOn'),
      knex.raw('MAX(s.updatedOn) as lastUsedOn'),
      knex.raw('MIN(s.createdBy) as createdBy') // Use first createdBy as the creator
    )
    .where('s.externalId', 'regexp', '^\\d{3}-\\d{6}-\\d{3}$')
    .whereNotNull('s.externalId')
    .groupBy(knex.raw('SUBSTRING(s.externalId, 1, 3)'))

  if (usedRecords.length === 0) {
    return // No used records found
  }

  // Update MobileDevice records with used data
  for (const record of usedRecords) {
    // eslint-disable-next-line no-await-in-loop
    await knex('MobileDevice').where('deviceAppSpot', record.deviceAppSpot).update({
      deviceCode: 'N/A',
      active: true,
    })
  }
}
