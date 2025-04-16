module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const { subDays } = require('date-fns')
const reporters = require('../fixtures/reporters.json')

async function seed(knex) {
  const tokensToInsert = reporters.map(report => {
    const days = _.random(1, 31)
    const createdOn = subDays(new Date(), days)
    const expires = subDays(new Date(), days + 1)
    return {
      ...report,
      createdOn,
      expires,
    }
  })

  if (tokensToInsert.length > 0) {
    await knex('RefreshToken').insert(tokensToInsert)
  }

  const resultDownload = await knex('ResultTreatmentStatusLog')
  const reporterCreatedOn = await knex('RefreshToken as tf').distinct().pluck('tf.createdOn')

  const logsToUpsert = resultDownload.map(({ resultId }) => ({
    method: 'reporter app',
    createdOn: _.sample(reporterCreatedOn),
    createdBy: _.random(1, 6),
    resultId,
  }))

  await knex('ResultDownloadLog').insert(logsToUpsert).onConflict(['resultId']).merge()
}
