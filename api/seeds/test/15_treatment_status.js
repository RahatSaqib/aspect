const _ = require('lodash')

const { resultTreatmentStatusToId } = require('../../src/shared/dictionary')
const { subMinutes } = require('date-fns')

module.exports = require('../utils').seed(seed, __filename)

const treatmentStatus = require('../fixtures/treatmentStatus.json')

const now = new Date()

const treatmentStatuses = ['OnTreatment', 'AwaitingTreatment', 'NotPossible']

async function seed(knex) {
  const [{ countTreatmentStatus }] = await knex('ResultTreatmentStatus').count(
    '* as countTreatmentStatus'
  )
  if (treatmentStatus.length > countTreatmentStatus) {
    await knex('ResultTreatmentStatus').insert(treatmentStatus)

    const results = await knex('Result').select('id')

    _.mapValues(results, async resultId => {
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
}
