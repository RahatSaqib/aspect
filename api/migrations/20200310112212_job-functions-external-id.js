module.exports = require('../src/db').migration(up, down)
const _ = require('lodash')

async function up(knex) {
  // Adds externalId field to JobFunction table
  await knex.schema.alterTable('JobFunction', tblJobFunc => {
    tblJobFunc.string('externalId')
  })

  // Creates all the calls for setting the externalId field for every job function
  const jobFunctions = await knex('JobFunction').select('id', 'name')

  // Sets the externalIds
  await Promise.all(
    jobFunctions.map(jobFunc =>
      knex('JobFunction')
        .where('id', '=', jobFunc.id)
        .update({ externalId: _.camelCase(jobFunc.name) })
    )
  )

  // Set externalId as not nullable
  await knex.schema.alterTable('JobFunction', tblJobFunc => {
    tblJobFunc
      .string('externalId')
      .notNullable()
      .alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('JobFunction', assayType => {
    assayType.dropColumn('externalId')
  })
}
