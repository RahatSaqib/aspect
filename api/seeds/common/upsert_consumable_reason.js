const fixture = require('../fixtures/consumableReason.json')

/**
 * Upserts consumable reasons into the database by performing inserts, updates, and deletions
 * based on the provided fixture data.
 *
 * @param {Object} knex - The Knex.js instance for database interaction.
 * @param {Object} fixture - The fixture data containing consumable reasons to persist.
 * @param {Array} fixture.data - An array of consumable reason objects.
 * @param {Object} options - Options to control the persisting behavior.
 * @param {boolean} [options.skipInserts=false] - If true, skip inserting new records.
 * @param {boolean} [options.skipUpdates=false] - If true, skip updating existing records.
 * @param {boolean} [options.skipDeletes=false] - If true, skip deleting records not in the fixture.
 * @returns {Promise<void>} A promise that resolves when all upsert operations are complete.
 */
const upsertConsumableReasons = async (knex, { skipInserts = false, skipUpdates = false, skipDeletes = false }) => {
  const fixtureExternalIds = fixture.data.map(cr => cr.externalId)

  // Fetch existing records
  const existingRecords = await knex('ConsumableReason').select('*')
  const existingMap = existingRecords.reduce((map, record) => {
    map[record.externalId] = record
    return map
  }, {})

  const updates = []
  const inserts = []

  // Process updates and inserts
  for (const cr of fixture.data) {
    const existing = existingMap[cr.externalId]
    if (existing && !skipUpdates) {
      updates.push(
        knex('ConsumableReason').where('externalId', cr.externalId).update({
          name: cr.name,
          i18nKey: cr.i18nKey,
          increaseDecrease: cr.increaseDecrease,
          userSelectable: cr.userSelectable,
          reset: cr.reset,
        })
      )
    } else if (!existing && !skipInserts) {
      inserts.push(
        knex('ConsumableReason').insert({
          name: cr.name,
          i18nKey: cr.i18nKey,
          increaseDecrease: cr.increaseDecrease,
          reset: cr.reset,
          userSelectable: cr.userSelectable,
          externalId: cr.externalId,
        })
      )
    }
  }

  let deletions = 0
  if (!skipDeletes) {
    // Delete records not in the fixture
    deletions = knex('ConsumableReason').whereNotIn('externalId', fixtureExternalIds).del()
    await deletions
  }

  // Execute all operations
  await Promise.all([...updates, ...inserts, deletions])
}

module.exports = { upsertConsumableReasons }
