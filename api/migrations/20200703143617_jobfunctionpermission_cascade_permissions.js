module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('JobFunctionPermission', tblJobFunctionPermission => {
    tblJobFunctionPermission.dropForeign('jobFunctionId')
    tblJobFunctionPermission
      .foreign('jobFunctionId')
      .references('id')
      .inTable('JobFunction')
      .onDelete('CASCADE')
    tblJobFunctionPermission.dropForeign('permissionId')
    tblJobFunctionPermission
      .foreign('permissionId')
      .references('id')
      .inTable('Permission')
      .onDelete('CASCADE')
  })
}

async function down(knex) {
  await knex.schema.table('JobFunctionPermission', tblJobFunctionPermission => {
    tblJobFunctionPermission.dropForeign('jobFunctionId')
    tblJobFunctionPermission
      .foreign('jobFunctionId')
      .references('id')
      .inTable('JobFunction')
      .onDelete('RESTRICT')
    tblJobFunctionPermission.dropForeign('permissionId')
    tblJobFunctionPermission
      .foreign('permissionId')
      .references('id')
      .inTable('Permission')
      .onDelete('RESTRICT')
  })
}
