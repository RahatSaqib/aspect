module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  await knex.schema.alterTable('Case', async tblCase => {
    tblCase.datetime('createdOn')
      .notNullable()
      .defaultTo(knex.fn.now())
    tblCase.datetime('updatedOn')
      .notNullable()
      .defaultTo(knex.fn.now())

    tblCase
      .integer('createdBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
    tblCase
      .integer('updatedBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')

    await knex('Case').where({ createdBy: null }).update({ createdBy: adminId })
    await knex('Case').where({ updatedBy: null }).update({ updatedBy: adminId })

    tblCase.integer('createdBy').notNullable().alter()
    tblCase.integer('updatedBy').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Case', tblCase => {
    tblCase.dropForeign('createdby')
    tblCase.dropForeign('updatedby')
    
    tblCase.dropColumns(['createdOn', 'updatedOn', 'createdBy', 'updatedBy'])
  })
}
