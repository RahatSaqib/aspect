module.exports = require('../utils').seed(async knex => {
  // Generate all possible 3-digit numbers (000-999)
  for (let i = 0; i <= 999; i++) {
    const deviceAppSpot = i.toString().padStart(3, '0')
    // eslint-disable-next-line no-await-in-loop
    await knex('MobileDevice').insert({
      deviceAppSpot,
      active: false, // Initially inactive until assigned to a real device
      createdOn: new Date(),
      updatedOn: new Date(),
      createdBy: 1,
      updatedBy: 1,
    })
  }

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
  const updatePromises = usedRecords.map(record => {
    return knex('MobileDevice').where('deviceAppSpot', record.deviceAppSpot).update({
      deviceCode: 'N/A',
      active: true,
      createdBy: record.createdBy,
      createdOn: record.firstUsedOn,
      updatedBy: record.createdBy,
      updatedOn: record.lastUsedOn,
    })
  })

  await Promise.all(updatePromises)
}
