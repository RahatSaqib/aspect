/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('Device', device => {
    device.integer('implementingPartnerId').unsigned().index().references('id').inTable('Partner')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('Device', device => {
    device.dropForeign('implementingPartnerId')
    device.dropColumns('implementingPartnerId')
  })
}
