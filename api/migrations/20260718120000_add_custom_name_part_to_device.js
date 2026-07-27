module.exports = require('../src/db').migration(up, down)

/**
 * Adds Device.customNamePart — a user-entered fragment inserted into the
 * generated device name between the identifier (`${acronym}${id}`) and any
 * plugin suffix (e.g. "GX101" + "— 1" + "(16m, 6c)" -> "GX101 — 1 (16m, 6c)").
 */
async function up(knex) {
  await knex.schema.alterTable('Device', table => {
    table.string('customNamePart', 20).notNullable().defaultTo('')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', table => {
    table.dropColumn('customNamePart')
  })
}
