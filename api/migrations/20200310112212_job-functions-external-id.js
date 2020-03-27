module.exports = require('../src/db').migration(up, down)
const _ = require('lodash')

const tblName = 'JobFunction'

async function up(knex) {
  // Adds externalId field to JobFunction table
  await knex.schema.alterTable(tblName, tblJobFunc => {
    tblJobFunc.string('externalId')
  })

  // Creates all the calls for setting the externalId field for every job function
  const updates = await knex
    .select('id', 'name')
    .from(tblName)
    .map(jobFunc => {
      return knex(tblName)
        .where('id', '=', jobFunc.id)
        .update({ externalId: _.camelCase(jobFunc.name) })
    })

  // Sets the externalIds
  await Promise.all(updates)

  // Set externalId as not nullable
  await knex.schema.alterTable(tblName, tblJobFunc => {
    tblJobFunc
      .string('externalId')
      .notNullable()
      .alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable(tblName, assayType => {
    assayType.dropColumn('externalId')
  })
}
