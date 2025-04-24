const { upsertConsumableReasons } = require('../common/upsert_consumable_reason')

module.exports = require('../utils').seed(async knex => {
  // Delete the automatic seed for 'damaged', as it's now duplicated
  await knex('ConsumableReason').where('externalId', 'damaged').del()
  // Update externalId from 'damage' to 'damaged', as externalId is the key in upsertConsumableReasons
  await knex('ConsumableReason').where('externalId', 'damage').update({ externalId: 'damaged' })

  // Only add the new ones
  await upsertConsumableReasons(knex, { skipDeletes: true, skipUpdates: true })

  // Fetch the ConsumableReason IDs
  const consumableReasons = await knex('ConsumableReason').select('id', 'externalId')
  const reasonMap = consumableReasons.reduce((map, reason) => {
    map[reason.externalId] = reason.id
    return map
  }, {})

  // Update "asserted_increase" and "imported" to "manual_addition"
  await knex('InventoryLog')
    .whereIn('consumableReasonId', [reasonMap.asserted_increase, reasonMap.imported])
    .update({ consumableReasonId: reasonMap.manual_addition })

  // Update "asserted_decrease" to "Other" with notes adjustment
  await knex('InventoryLog')
    .where('consumableReasonId', reasonMap.asserted_decrease)
    .update({
      consumableReasonId: reasonMap.Other,
      notes: knex.raw("COALESCE(notes, 'Asserted Inventory On Hand Decrease')"),
    })

  // Replace "asserted_zero_inventory" with "Captured" and set quantity to 0
  await knex('InventoryLog').where('consumableReasonId', reasonMap.asserted_zero_inventory).update({
    consumableReasonId: reasonMap.Captured,
    quantity: 0,
  })

  await upsertConsumableReasons(knex, { skipInserts: true })
}, __filename)
