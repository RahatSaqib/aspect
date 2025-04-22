module.exports = require('../utils').seed(async knex => {
  // Fetch the necessary ConsumableReason IDs based on externalId
  const consumableReasons = await knex('ConsumableReason')
    .select('id', 'externalId')
    .whereIn('externalId', ['manual_addition', 'Other', 'Captured'])

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
}, __filename)
