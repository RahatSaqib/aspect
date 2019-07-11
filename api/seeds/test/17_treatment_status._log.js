const _ = require('lodash')

const { resultTreatmentStatusToId } = require('../../src/shared/dictionary')
const { subMonths, addDays, addMinutes, startOfMonth } = require('date-fns')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const now = new Date()
  const midMonth = addDays(startOfMonth(now), 15)
  const treatmentStatusOnTreatmentId = await resultTreatmentStatusToId(
    'OnTreatment'
  )
  const treatmentStatusNotPossibleId = await resultTreatmentStatusToId(
    'NotPossible'
  )

  // get first matched result
  const result = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .where('rc.externalId', 'Detected')
    .where('rca.requiresTreatment', 1)
    .first('r.*')

  const { externalId } = result
  const restData = _.omit(result, ['id', 'endedOn', 'treatmentStatusLogId'])
  let cnt = 0

  // for each month since 12 months back - insert 30-50 results
  await Promise.all(
    _.range(1, 12).map(async shift => {
      // middle of the previous months
      const midMonth2 = subMonths(midMonth, shift)

      await Promise.all(
        _.range(_.random(30, 50)).map(async () => {
          // range dates +-5 days from mid month, and +-4 hours (in mins)
          const endedOn = addMinutes(
            addDays(midMonth2, _.random(-5, 5)),
            _.random(-240, 240)
          )

          cnt += 1
          const [resultId] = await knex('Result').insert({
            ...restData,
            externalId: `${externalId}-${cnt}`,
            endedOn,
          })
          //
          const num = _.random(100)
          let resultTreatmentStatusId = null
          // 40% of new results are 'on treatment'
          if (_.inRange(num, 0, 40)) {
            resultTreatmentStatusId = treatmentStatusOnTreatmentId
          }
          // 20% of new results are 'unaccountable'
          else if (_.inRange(num, 50, 70)) {
            resultTreatmentStatusId = treatmentStatusNotPossibleId
          }

          if (resultTreatmentStatusId) {
            // insert in ResultTreatmentStatusLog
            const [treatmentStatusLogId] = await knex(
              'ResultTreatmentStatusLog'
            ).insert({
              resultId,
              resultTreatmentStatusId,
              changedOn: now,
              createdOn: now,
            })
            // update Result
            await knex('Result')
              .update({
                treatmentStatusLogId,
              })
              .where({ id: resultId })
          }
        })
      )
    })
  )
}
