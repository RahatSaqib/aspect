module.exports = require('../src/db').migration(up, down)
const { updateCase } = require('../src/case/service')

async function up(knex) {
  const adminUser = await knex('User')
    .where({ name: 'admin' })
    .first('id')

  await knex.schema.alterTable('Case', async tblCase => {
    tblCase
      .datetime('createdOn')
      .notNullable()
      .defaultTo(knex.fn.now())
    tblCase
      .datetime('updatedOn')
      .notNullable()
      .defaultTo(knex.fn.now())

    tblCase
      .integer('createdBy')
      .nullable()
    tblCase
      .integer('updatedBy')
      .nullable()

    if (adminUser) {
      const { id: adminId } = adminUser
      await updateCase({ createdBy: null }, { createdBy: adminId })
      await updateCase({ updatedBy: null }, { updatedBy: adminId })
    }

    tblCase
      .integer('createdBy')
      .unsigned()
      .index()
      .notNullable()
      .references('id')
      .inTable('User')
      .alter()
    tblCase
      .integer('updatedBy')
      .unsigned()
      .index()
      .notNullable()
      .references('id')
      .inTable('User')
      .alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Case', tblCase => {
    tblCase.dropForeign('createdby')
    tblCase.dropForeign('updatedby')

    tblCase.dropColumns(['createdOn', 'updatedOn', 'createdBy', 'updatedBy'])
  })
}
