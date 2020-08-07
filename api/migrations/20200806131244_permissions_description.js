module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  /* Adding TZ table just for querying purpose */
  await knex.schema.table('Permission', tblPermissions => {
    tblPermissions
      .string('description')
      .notNullable()
      .defaultTo('')
    tblPermissions
      .string('includedActivities')
      .notNullable()
      .defaultTo('')
  })
}

async function down(knex) {
  await knex.schema.table('Permission', tblPermissions => {
    tblPermissions.dropColumn('description')
    tblPermissions.dropColumn('includedActivities')
  })
}
