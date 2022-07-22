const Promise = require('bluebird')
const _ = require('lodash')

// eslint-disable-next-line import/no-dynamic-require
const geography = require(`../${process.env['seeds.directory'].substring(1)}/fixtures/geography.json`)

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await Promise.each(geography.countries, async country => {
    const countryData = _.pick(country, ['a3', 'timezone'])
    return knex('Country')
      .update(countryData)
      .where('a3', countryData.a3)
      .andWhere('timezone', '<>', countryData.timezone)
  })
  const personsToUpdate = await knex('Person')
    .whereNotNull('timezone')
    .whereNotIn('timezone', knex.select('id').from('TimeZone'))
    .pluck('id')
  const sitesToUpdate = await knex('Site')
    .whereNotNull('timezoneid')
    .whereNotIn('timezoneid', knex.select('id').from('TimeZone'))
    .pluck('id')
  const devicesToUpdate = await knex('Device')
    .whereNotNull('timezone')
    .whereNotIn('timezone', knex.select('id').from('TimeZone'))
    .pluck('id')

  await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .whereIn('s.id', sitesToUpdate)
    .update('s.timezoneId', knex.raw('c.timezone'))

  await knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .whereIn('d.id', devicesToUpdate)
    .update('d.timezone', knex.raw('s.timezoneid'))

  await knex('Person as p')
    .join('Geography as g', 'p.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Site as s', 'g.id', 's.geographyId')
    .whereIn('p.id', personsToUpdate)
    .update('p.timezone', knex.raw('COALESCE(s.timezoneId,c.timezone)'))

  await knex.schema.raw(`ALTER TABLE TimeZone MODIFY
  id VARCHAR(100)
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;`)

  await knex.schema.alterTable('Device', devices => {
    devices.string('timezone', 100).defaultTo(null).references('id').inTable('TimeZone').onDelete('SET NULL').alter()
  })

  await knex.schema.alterTable('Person', person => {
    person.string('timezone', 100).references('id').inTable('TimeZone').alter()
  })

  await knex.schema.alterTable('Country', country => {
    country.string('timezone', 100).references('id').inTable('TimeZone').alter()
  })
  await knex.schema.alterTable('Site', site => {
    site.string('timezoneid', 100).defaultTo(null).references('id').inTable('TimeZone').onDelete('SET NULL').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', devices => {
    devices.dropForeign('timezone')
  })

  await knex.schema.alterTable('Person', person => {
    person.dropForeign('timezone')
  })
  await knex.schema.alterTable('Country', country => {
    country.dropForeign('timezone')
  })
  await knex.schema.alterTable('Site', site => {
    site.dropForeign('timezoneId')
  })
  await knex.schema.alterTable('Device', devices => {
    devices.string('timezone', 45).defaultTo(null).alter()
  })
}
