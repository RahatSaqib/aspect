module.exports = require('../src/db').migration(up, down)

const Promise = require('bluebird')
const _ = require('lodash')

async function up(knex) {
  await knex.schema.table('Result', result => {
    result.text('notes').alter()
    result.text('errorNotes').alter()
  })
}

async function down(knex) {
  const longNotes = await knex('Result').where(knex.raw('LENGTH(notes) > 2000')).select('id')

  await Promise.all(
    _.map(longNotes, async row => {
      await knex('Result').where({ id: row.id }).update('notes', knex.raw('LEFT(notes, 2000)'))
    })
  )

  const longErrorNotes = await knex('Result').where(knex.raw('LENGTH(errorNotes) > 2000')).select('id')

  await Promise.all(
    _.map(longErrorNotes, async row => {
      await knex('Result').where({ id: row.id }).update('errorNotes', knex.raw('LEFT(errorNotes, 2000)'))
    })
  )

  await knex.schema.table('Result', result => {
    result.string('notes', 2000).alter()
    result.string('errorNotes', 2000).alter()
  })
}
