/* eslint-disable import/no-dynamic-require */
const _ = require('lodash')

const geography = require(`../${process.env['seeds.directory']}/fixtures/geography.json`)
const timezones = require(`../${process.env['seeds.directory']}/../fixtures/TimeZone.json`)

const getIndexName = (fieldName, timeZone) => {
  const tzSnaked = _.replace(timeZone, '/', '_')
  return `result_${fieldName}_tz_${tzSnaked}`.toLowerCase()
}

exports.up = async function (knex) {
  await Promise.all(
    _.map(geography.countries, async country => {
      const { timeZone } = timezones.data.find(tz => tz.id === country.timezone) || {}
      if (timeZone) {
        return knex.schema.alterTable('Result', function (tbl) {
          tbl.index([knex.raw(`(CONVERT_TZ(endedOn, "+00:00", "${timeZone}"))`)], getIndexName('endedOn', timeZone))
          tbl.index([knex.raw(`(CONVERT_TZ(startedOn, "+00:00", "${timeZone}"))`)], getIndexName('startedOn', timeZone))
        })
      }
    })
  )
}

exports.down = async function (knex) {
  await Promise.all(
    _.map(geography.countries, async country => {
      const { timeZone } = timezones.data.find(tz => tz.id === country.timezone) || {}
      if (timeZone) {
        return knex.schema.alterTable('Result', function (tbl) {
          /**
           * use empty array for columns because it is ignored if
           * index name in 2nd param is specified
           * (see https://knexjs.org/guide/schema-builder.html#dropindex)
           */
          tbl.dropIndex([], getIndexName('endedOn', timeZone))
          tbl.dropIndex([], getIndexName('startedOn', timeZone))
        })
      }
    })
  )
}

exports.config = { transaction: true }
