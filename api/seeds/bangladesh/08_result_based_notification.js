const _ = require('lodash')
const Promise = require('bluebird')
const NotificationTypeCategory = require('../fixtures/NotificationTypeCategory.json')

async function seed(knex) {
  await Promise.each(NotificationTypeCategory.data || [], async datum => {
    const existingRecords = await knex('NotificationTypeCategory')
      .where('externalId', datum.externalId)
      .first('id')
    const elementToInsert = _.reduce(
      _.keys(datum),
      (result, key) => {
        result[key] = _.isObject(datum[key])
          ? JSON.stringify(datum[key])
          : datum[key]
        return result
      },
      {}
    )
    if (!existingRecords) {
      await knex('NotificationTypeCategory').insert(elementToInsert)
    } else {
      await knex('NotificationTypeCategory')
        .update(elementToInsert)
        .where('externalId', elementToInsert.externalId)
    }
  })
}

module.exports = require('../utils').seed(seed, __filename)
