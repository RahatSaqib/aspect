module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('JobFunctionReport', tblJobFunctionReport => {
    tblJobFunctionReport
      .integer('jobFunctionId')
      .notNullable()
      .unsigned()
      .index()
      .references('id')
      .inTable('JobFunction')

    tblJobFunctionReport.integer('reportId').notNullable().unsigned().index().references('id').inTable('Report')
    tblJobFunctionReport.string('fileName').nullable()
    tblJobFunctionReport.primary(['jobFunctionId', 'reportId'])
  })

  await knex.schema.alterTable('Report', tblReport => {
    tblReport.dropForeign('partnerId')
    tblReport.dropForeign('geographyId')
    tblReport.dropColumn('partnerId')
    tblReport.dropColumn('geographyId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Report', tblReport => {
    tblReport.integer('partnerId').unsigned().index().references('id').inTable('Partner').onDelete('SET NULL')
    tblReport.integer('geographyId').unsigned().index().references('id').inTable('Geography').onDelete('SET NULL')
    tblReport.string('fileName').notNullable().alter()
  })

  await knex.schema.dropTable('JobFunctionReport')
}
