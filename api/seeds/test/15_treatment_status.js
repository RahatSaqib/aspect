const _ = require('lodash')

const { subMinutes } = require('date-fns')
const { resultTreatmentStatusToId } = require('../../src/shared/dictionary')

module.exports = require('../utils').seed(seed, __filename)

const treatmentStatus = require('../fixtures/ResultTreatmentStatus.json')
const { ensureResultTreatmentStatuses } = require('../common')

const now = new Date()

const treatmentStatuses = ['OnTreatment', 'AwaitingTreatment', 'NotPossible']

async function seed(knex) {
  const [{ countTreatmentStatus }] = await knex('ResultTreatmentStatus').count('* as countTreatmentStatus')
  if (treatmentStatus.length > countTreatmentStatus) {
    await ensureResultTreatmentStatuses(knex, treatmentStatus)

    const results = await knex('Result').select('id')

    _.mapValues(results, async resultId => {
      // generate random treatment status
      const treatment = await resultTreatmentStatusToId(treatmentStatuses[_.random(0, treatmentStatuses.length - 1)])

      const [treatmentStatusLogId] = await knex('ResultTreatmentStatusLog').insert({
        resultId: resultId.id,
        resultTreatmentStatusId: treatment,
        changedOn: subMinutes(now, 90),
        createdOn: subMinutes(now, 90),
      })

      await knex('Result').where('id', resultId.id).update({
        treatmentStatusLogId,
      })
    })
  }
}
