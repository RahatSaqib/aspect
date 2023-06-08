/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('InventoryLog', t => {
    t.dateTime('effectiveDate')
  })
  await knex('InventoryLog').update({
    effectiveDate: knex.ref('createdOn'),
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('InventoryLog', t => {
    t.dropColumn('effectiveDate')
  })
}
