module.exports = require('../utils').seed(seed, __filename)
const _ = require('lodash')
const Promise = require('bluebird')

async function seed(knex) {
  const resultDownload = await knex('ResultTreatmentStatusLog')
  const reporterLoggedUser = await knex('RefreshToken as tf')
    .distinct()
    .select('tf.createdOn')
  const reporterCreatedOn = _.map(
    reporterLoggedUser,
    loggedDetail => loggedDetail.createdOn
  )

  await Promise.each(resultDownload, async results => {
    await knex('ResultDownloadLog').insert({
      method: 'reporter_app',
      createdOn: _.sample([...reporterCreatedOn]),
      createdBy: _.random(1, 5),
      resultId: results.resultId,
    })
  })
}
