module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Partner', partner => {
    partner.specificType('displayPreferences', 'JSON')
  })
}

async function down(knex) {
  await knex.schema.table('Partner', partner => {
    partner.dropColumn('displayPreferences')
  })
}
