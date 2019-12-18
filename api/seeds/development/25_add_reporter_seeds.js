module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const _ = require('lodash')
const dns = require('date-fns')
const reporters = require('../fixtures/reporters.json')

async function seed(knex) {
  await Promise.all(
    _.map(reporters, async report => {
      const subDays = _.random(1, 31)
      const createdOn = dns.subDays(new Date(), subDays)
      const expires = dns.subDays(new Date(), subDays + 1)
      await knex('RefreshToken').insert({
        ...report,
        createdOn,
        expires,
      })
    })
  )

  const resultDownload = await knex('ResultTreatmentStatusLog')
  const reporterLoggedUser = await knex('RefreshToken as tf')
    .distinct()
    .select('tf.createdOn')
  const reporterCreatedOn = _.map(
    reporterLoggedUser,
    loggedDetail => loggedDetail.createdOn
  )

  await Promise.all(
    await Promise.each(resultDownload, async results => {
      await knex('ResultDownloadLog').insert({
        method: 'reporter_app',
        createdOn: _.sample([...reporterCreatedOn]),
        createdBy: _.random(1, 6),
        resultId: results.resultId,
      })
    })
  )
}
