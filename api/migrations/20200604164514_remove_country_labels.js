module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Country', tblCountry => {
    tblCountry.dropColumn('stateLabel')
    tblCountry.dropColumn('lgaLabel')
  })
}

async function down(knex) {
  await knex.schema.table('Country', tblCountry => {
    tblCountry.string('stateLabel')
    tblCountry.string('lgaLabel')
  })
}
