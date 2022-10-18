const _ = require('lodash')
const Promise = require('bluebird')

async function upsertFixture(knex, fixture, table) {
  await Promise.each(fixture.data || [], async datum => {
    const existingRecords = await knex(table).where('externalId', datum.externalId).first('id')
    const elementToInsert = _.reduce(
      _.keys(datum),
      (result, key) => {
        result[key] = _.isObject(datum[key]) ? JSON.stringify(datum[key]) : datum[key]
        return result
      },
      {}
    )
    if (!existingRecords) {
      await knex(table).insert(elementToInsert)
    } else {
      await knex(table).update(elementToInsert).where('externalId', elementToInsert.externalId)
    }
  })
}

module.exports = {
  upsertFixture,
}
