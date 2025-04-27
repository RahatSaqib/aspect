const fixture = require('../fixtures/consumableReason.json')
const { buildUpdates } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  // Fetch the ConsumableReasons)
  const consumableReasons = await knex('ConsumableReason').select('*')
  const reasonMap = consumableReasons.reduce((map, reason) => {
    map[reason.externalId] = reason.id
    return map
  }, {})

  await updateHistoricalRecordsInInventoryLog(knex, reasonMap)

  await updateConsumableReasonValues(knex, consumableReasons)

  await removeDeletedReasons(knex)
}, __filename)

async function removeDeletedReasons(knex) {
  // Delete any ConsumableReason records that are not in the fixture
  await knex('ConsumableReason')
    .whereNotIn(
      'externalId',
      fixture.data.map(f => f.externalId)
    )
    .del()
}

async function updateConsumableReasonValues(knex, consumableReasons) {
  // Update all the changed values in the fixture
  const changesToUpdate = buildUpdates(fixture, consumableReasons, 'externalId')
  const updatePromises = []
  for (const change of changesToUpdate) {
    updatePromises.push(knex('ConsumableReason').where('id', change.id).update(change))
  }
  return Promise.all(updatePromises)
}

async function updateHistoricalRecordsInInventoryLog(knex, reasonMap) {
  // Default seeding doesn't support changing the externalId then
  // Move all InventoryLog records to the new 'damaged' Id
  if (reasonMap.damaged && reasonMap.damage) {
    await knex('InventoryLog')
      .where('consumableReasonId', reasonMap.damage)
      .update({ consumableReasonId: reasonMap.damaged })
    // Delete the old record with externalId 'damage'
    await knex('ConsumableReason').where('externalId', 'damage').del()
  }

  // Update "asserted_increase" and "imported" to "manual_addition"
  if (reasonMap.asserted_increase && reasonMap.imported && reasonMap.manual_addition) {
    await knex('InventoryLog')
      .whereIn('consumableReasonId', [reasonMap.asserted_increase, reasonMap.imported])
      .update({ consumableReasonId: reasonMap.manual_addition })
  }

  // Update "asserted_decrease" to "Other" with notes adjustment
  if (reasonMap.asserted_decrease && reasonMap.other) {
    await knex('InventoryLog')
      .where('consumableReasonId', reasonMap.asserted_decrease)
      .update({
        consumableReasonId: reasonMap.other,
        notes: knex.raw("COALESCE(notes, 'Asserted Inventory On Hand Decrease')"),
      })
  }

  if (reasonMap.asserted_zero_inventory && reasonMap.captured) {
    // Replace "asserted_zero_inventory" with "Captured" and set quantity to 0
    await knex('InventoryLog').where('consumableReasonId', reasonMap.asserted_zero_inventory).update({
      consumableReasonId: reasonMap.Captured,
      quantity: 0,
    })
  }
}
