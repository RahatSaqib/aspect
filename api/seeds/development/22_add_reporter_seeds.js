module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const _ = require('lodash')
const { subDays } = require('date-fns')
const reporters = require('../fixtures/reporters.json')
const { upsertSingle } = require('../utils')

async function seed(knex) {
  await Promise.all(
    _.map(reporters, async report => {
      const days = _.random(1, 31)
      const createdOn = subDays(new Date(), days)
      const expires = subDays(new Date(), days + 1)
      await knex('RefreshToken').insert({
        ...report,
        createdOn,
        expires,
      })
    })
  )

  const resultDownload = await knex('ResultTreatmentStatusLog')
  const reporterLoggedUser = await knex('RefreshToken as tf').distinct().select('tf.createdOn')
  const reporterCreatedOn = _.map(reporterLoggedUser, loggedDetail => loggedDetail.createdOn)

  await Promise.each(resultDownload, results =>
    upsertSingle(knex, 'ResultDownloadLog', ['resultId'], {
      method: 'reporter app',
      createdOn: _.sample([...reporterCreatedOn]),
      createdBy: _.random(1, 6),
      resultId: results.resultId,
    })
  )
}
