module.exports = require('../src/db').migration(up, down)

const tblCase = 'Case'

async function up(knex) {
  await knex.schema.alterTable(tblCase, tbl => {
    tbl.integer('partnerId').nullable()
    tbl.unique(['externalId', 'partnerId'])
  })
}

async function down(knex) {
  await knex.schema.alterTable(tblCase, tbl => {
    tbl.dropIndex(['externalId', 'partnerId'])
    tbl.dropColumn('partnerId')
  })
}
