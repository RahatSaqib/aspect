/* eslint-disable import/no-dynamic-require */
const _ = require('lodash')
const Promise = require('bluebird')

const geography = require(`../${process.env['seeds.directory']}/fixtures/geography.json`)
const timezones = require(`../seeds/fixtures/TimeZone.json`)
const databaseName = process.env['db.databaseName']

const getIndexName = (fieldName, timeZone) => {
  const tzSnaked = _.replace(timeZone, '/', '_')
  return `result_${fieldName}_tz_${tzSnaked}`.toLowerCase()
}

const fieldsToIndex = ['endedOn', 'startedOn']

/**
 * array with all combinations of fieldName and timeZone
 */
const items = _.reduce(
  geography.countries,
  (acc, country) => {
    const { timeZone } = timezones.data.find(tz => tz.id === country.timezone) || {}
    if (timeZone) {
      _.map(fieldsToIndex, fieldName => {
        acc = [...acc, { fieldName, timeZone }]
      })
    }
    return acc
  },
  []
)

exports.up = async function (knex) {
  /**
   *
   */
  await Promise.each(items, async ({ fieldName, timeZone }) => {
    const { cnt } = await knex('INFORMATION_SCHEMA.STATISTICS')
      .where('TABLE_SCHEMA', databaseName)
      .where('TABLE_NAME', 'Result')
      .where('INDEX_NAME', getIndexName(fieldName, timeZone))
      .select(knex.raw('COUNT(*) as cnt'))
      .first()
    if (cnt === 0) {
      return knex.schema.alterTable('Result', function (tbl) {
        tbl.index([knex.raw(`(CONVERT_TZ(${fieldName}, "+00:00", "${timeZone}"))`)], getIndexName(fieldName, timeZone))
      })
    }
  })
}

exports.down = async function (knex) {
  await Promise.all(
    _.map(items, async ({ fieldName, timeZone }) => {
      return knex.schema.alterTable('Result', function (tbl) {
        /**
         * use empty array for columns because it is ignored if
         * index name in 2nd param is specified
         * (see https://knexjs.org/guide/schema-builder.html#dropindex)
         */
        tbl.dropIndex([], getIndexName(fieldName, timeZone))
      })
    })
  )
}

exports.config = { transaction: true }
