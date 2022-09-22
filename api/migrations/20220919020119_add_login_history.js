exports.up = async function (knex) {
  await knex.schema.createTable('LoginHistory', auditUserLogin => {
    auditUserLogin.integer('userId').unsigned().nullable().index().references('id').inTable('User')
    auditUserLogin.string('userName').notNullable()
    auditUserLogin.string('action', 25).notNullable()
    auditUserLogin.integer('success').notNullable()
    auditUserLogin.string('code', 100).nullable()
    auditUserLogin.string('message', 2048).nullable()
    auditUserLogin.dateTime('createdOn').notNullable().index()
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('LoginHistory')
}
