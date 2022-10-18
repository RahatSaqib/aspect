module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await upFunc(knex, 'SiteTag', 'Site', 'siteId')
  await upFunc(knex, 'DeviceTag', 'Device', 'deviceId')
  await upFunc(knex, 'PersonTag', 'Person', 'personId')
  await upFunc(knex, 'ResultTag', 'Result', 'resultId')
}

async function down(knex) {
  await downFunc(knex, 'SiteTag', 'Site', 'siteId')
  await downFunc(knex, 'DeviceTag', 'Device', 'deviceId')
  await downFunc(knex, 'PersonTag', 'Person', 'personId')
  await downFunc(knex, 'ResultTag', 'Result', 'resultId')
}

async function upFunc(knex, tblName, refTable, refColName) {
  await knex.schema.alterTable(tblName, tbl => {
    tbl.dropPrimary([refColName, 'tagId'])
    tbl.dropForeign(refColName)
    tbl.dropIndex(refColName)
  })

  await knex.schema.alterTable(tblName, tbl => {
    tbl.integer(refColName).unsigned().nullable().index().references('id').inTable(refTable).alter()
    tbl.unique([refColName, 'tagId'])
  })
}

async function downFunc(knex, tblName, refTable, refColName) {
  await knex.schema.alterTable(tblName, tbl => {
    tbl.dropUnique([refColName, 'tagId'])
    tbl.dropForeign(refColName)
    tbl.dropIndex(refColName)
  })

  await knex.schema.alterTable(tblName, tbl => {
    tbl.integer(refColName).unsigned().notNullable().index().references('id').inTable(refTable).alter()
    tbl.primary([refColName, 'tagId'])
  })
}
