module.exports = require('../src/db').migration(up, down)

const Promise = require('bluebird')
const map = require('lodash/map')
const camelCase = require('lodash/camelCase')

async function up(knex) {
  await knex.schema.table('Report', report => {
    report.string('i18nKeyDescription')
  })

  const reports = await knex('Report')
  await Promise.all(
    map(reports, async ({ externalId }) =>
      knex('Report')
        .where({ externalId })
        .update({ i18nKeyDescription: `${camelCase(externalId)}Description` })
    )
  )

  await knex.schema.alterTable('Report', tblReport => {
    tblReport.string('i18nKeyDescription').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.table('Report', tblReport => {
    tblReport.dropColumn('i18nKeyDescription')
  })
}
