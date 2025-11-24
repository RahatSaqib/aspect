const fixture = require('../fixtures/ConsumableReason.json')

module.exports = require('../utils').seed(async knex => {
  // Fetch the ConsumableReasons
  const consumableReasons = await knex('ConsumableReason').select('*')

  const reasonMap = consumableReasons.reduce((map, reason) => {
    map[reason.externalId] = reason.id
    return map
  }, {})

  if (reasonMap.used) {
    await knex('ConsumableReason').where('externalId', 'test_conducted').del()
    const testConductedFixture = fixture.data.find(f => f.externalId === 'test_conducted')
    await knex('ConsumableReason').where('externalId', 'used').update(testConductedFixture)
  }

  if (reasonMap.zero) {
    await knex('InventoryLog').where('consumableReasonId', reasonMap.zero).del()
    await knex('ConsumableReason').where('externalId', 'zero').del()
  }

  if (reasonMap.captured) {
    await knex('ConsumableReason').where('externalId', 'physical_count').del()
    const physicalCountFixture = fixture.data.find(f => f.externalId === 'physical_count')
    await knex('ConsumableReason').where('externalId', 'captured').update(physicalCountFixture)
  }

  if (reasonMap.imported) {
    await knex('InventoryLog')
      .where('consumableReasonId', reasonMap.imported)
      .update({ consumableReasonId: reasonMap.manual_addition })
    await knex('ConsumableReason').where('externalId', 'imported').del()
  }

  if (reasonMap.deteriorated) {
    await knex('ConsumableReason').where('externalId', 'damaged').del()
    const damagedFixture = fixture.data.find(f => f.externalId === 'damaged')
    await knex('ConsumableReason').where('externalId', 'deteriorated').update(damagedFixture)
  }

  if (reasonMap.asserted_increase) {
    await knex('InventoryLog')
      .where('consumableReasonId', reasonMap.asserted_increase)
      .update({ consumableReasonId: reasonMap.manual_addition })
    await knex('ConsumableReason').where('externalId', 'asserted_increase').del()
  }

  if (reasonMap.asserted_decrease) {
    await knex('InventoryLog')
      .where('consumableReasonId', reasonMap.asserted_decrease)
      .update({ consumableReasonId: reasonMap.other })
    await knex('ConsumableReason').where('externalId', 'asserted_decrease').del()
  }

  if (reasonMap.sent) {
    await knex('ConsumableReason').where('externalId', 'transfer_sent').del()
    const transferSentFixture = fixture.data.find(f => f.externalId === 'transfer_sent')
    await knex('ConsumableReason').where('externalId', 'sent').update(transferSentFixture)
  }

  if (reasonMap.received) {
    await knex('ConsumableReason').where('externalId', 'transfer_received').del()
    const transferReceivedFixture = fixture.data.find(f => f.externalId === 'transfer_received')
    await knex('ConsumableReason').where('externalId', 'received').update(transferReceivedFixture)
  }
}, __filename)
