module.exports = require('../src/db').migration(up, down)
const _ = require('lodash')

const tblName = 'JobFunction'

async function up(knex) {
  await knex.schema.alterTable(tblName, tblJobFunc => {
    tblJobFunc.string('externalId')
  })

  const updates = await knex
    .select('id', 'name')
    .from(tblName)
    .map(jobFunc => {
      return knex(tblName)
        .where('id', '=', jobFunc.id)
        .update({ externalId: _.camelCase(jobFunc.name) })
    })

  Promise.all(updates).then(async () => {
    await knex.schema.alterTable(tblName, tblJobFunc => {
      tblJobFunc
        .string('externalId')
        .notNullable()
        .alter()
    })
  })
}
async function down(knex) {
  await knex.schema.alterTable(tblName, assayType => {
    assayType.dropColumn('externalId')
  })
}
