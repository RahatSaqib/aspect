const fixture = require('../fixtures/consumableReason.json')

module.exports = require('../utils').seed(async knex => {
  // Automatic static seeds in Utils don't support change the extenralId
  // So we need to delete the automatic seeded record for the 'damaged' reason...
  await knex('ConsumableReason').where('externalId', 'damaged').del()
  // ...and change the existing one from 'damage' to 'damaged'.
  await knex('ConsumableReason').where('externalId', 'damage').update({ externalId: 'damaged' })

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

  await knex('ConsumableReason')
    .whereNotIn(
      'externalId',
      fixture.data.map(f => f.externalId)
    )
    .del()
}, __filename)
