module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('RefreshToken', t => {
    t
      .string('deviceTokenId', 255)
      .nullable()
      .after('token')
      .unique()
      .index()
  })
}
async function down(knex) {
  await knex.schema.alterTable('RefreshToken', t => {
    t.dropColumn('deviceTokenId')
  })
}
