const _ = require('lodash')
const Promise = require('bluebird')
const { resultTreatmentStatusToId } = require('../../src/shared/dictionary')
const { subMinutes, format } = require('date-fns')

module.exports = require('../utils').seed(
  seed,
  `${__filename}-${format(new Date(), 'YYYY-MM-dd')}`
)

const now = new Date()

const treatmentStatuses = ['OnTreatment', 'AwaitingTreatment', 'NotPossible']

async function seed(knex) {
  const results = await knex('Result')
    .where({ treatmentStatusLogId: null })
    .select('id')

  await Promise.each(_.sampleSize(results, 5), async resultId => {
    // generate random treatment status

    const treatment = await resultTreatmentStatusToId(
      treatmentStatuses[_.random(0, treatmentStatuses.length - 1)]
    )

    const [treatmentStatusLogId] = await knex(
      'ResultTreatmentStatusLog'
    ).insert({
      resultId: resultId.id,
      resultTreatmentStatusId: treatment,
      changedOn: subMinutes(now, 90),
      createdOn: subMinutes(now, 90),
    })

    await knex('Result')
      .where('id', resultId.id)
      .update({
        treatmentStatusLogId,
      })
  })
}
