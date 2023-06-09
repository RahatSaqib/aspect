const Promise = require('bluebird')
const camelCase = require('lodash/camelCase')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('Partner', partner => {
    partner.string('externalId').nullable()
  })

  const partners = await knex('Partner').select(['id', 'name'])
  await Promise.each(partners, async partner => {
    await knex('Partner')
      .where('id', partner.id)
      .update({ externalId: camelCase(partner.name) })
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('Partner', partner => {
    partner.dropColumn('externalId')
  })
}
