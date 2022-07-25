module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Case', async tblCase => {
    tblCase.datetime('createdOn').notNullable().defaultTo(knex.fn.now())
    tblCase.datetime('updatedOn').notNullable().defaultTo(knex.fn.now())

    tblCase.integer('createdBy').nullable()

    tblCase.integer('updatedBy').nullable()
  })

  const adminUser = await knex('User').where({ name: 'admin' }).first('id')
  if (adminUser) {
    const { id: adminId } = adminUser
    await knex('Case').where({ createdBy: null }).update({ createdBy: adminId })
    await knex('Case').where({ updatedBy: null }).update({ updatedBy: adminId })
  }

  await knex.schema.alterTable('Case', async tblCase => {
    tblCase.integer('createdBy').unsigned().index().notNullable().references('id').inTable('User').alter()
    tblCase.integer('updatedBy').unsigned().index().notNullable().references('id').inTable('User').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Case', tblCase => {
    tblCase.dropForeign('createdby')
    tblCase.dropForeign('updatedby')

    tblCase.dropColumns(['createdOn', 'updatedOn', 'createdBy', 'updatedBy'])
  })
}
