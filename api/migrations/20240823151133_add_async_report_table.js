exports.up = async function (knex) {
  await knex.schema.createTable('AsyncReportStatus', function (tbl) {
    tbl.increments('id').primary()
    tbl.string('name', 100).notNullable()
    tbl.string('externalId', 100).notNullable().index()
  })

  await knex('AsyncReportStatus').insert([
    { name: 'Queued', externalId: 'queued' },
    { name: 'Processing', externalId: 'processing' },
    { name: 'Ready', externalId: 'ready' },
    { name: 'Error', externalId: 'error' },
  ])

  await knex.schema.createTable('AsyncReport', function (tbl) {
    tbl.increments('id').primary()
    tbl.integer('reportId').unsigned().notNullable().references('id').inTable('Report')
    tbl.string('hash', 32).notNullable().index()
    tbl.specificType('query', 'JSON').notNullable()
    tbl.string('queryHash', 32).notNullable().index()
    tbl.specificType('auth', 'JSON').notNullable()

    /**
     * status fields
     */
    tbl.integer('statusId').unsigned().notNullable().references('id').inTable('AsyncReportStatus')
    tbl.specificType('errorMessage', 'JSON')

    /**
     * audit fields
     */
    tbl.dateTime('createdOn').defaultTo(knex.fn.now()).index()
    tbl.dateTime('updatedOn').defaultTo(knex.fn.now()).index()
    tbl.dateTime('startedOn').index()
    tbl.dateTime('endedOn').index()
    tbl.integer('generationTimeInMsec').index() // generationTime (this is [endedOn]-[startedOn] in milliseconds)
    tbl.dateTime('expiresOn').index()

    tbl.string('filePath', 1024)
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('AsyncReport')
  await knex.schema.dropTableIfExists('AsyncReportStatus')
}
