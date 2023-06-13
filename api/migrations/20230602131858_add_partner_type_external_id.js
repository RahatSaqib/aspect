/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('PartnerType', partnerType => {
    partnerType.string('externalId').nullable()
  })

  await knex('PartnerType').update({
    externalId: knex.raw('LOWER(name)'),
  })

  await knex.schema.alterTable('PartnerType', partnerType => {
    partnerType.dropNullable('externalId')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('PartnerType', partnerType => {
    partnerType.dropForeign('externalId')
  })
}
