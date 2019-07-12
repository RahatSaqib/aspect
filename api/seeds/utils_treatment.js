/* eslint-disable prettier/prettier */
/* eslint-disable linebreak-style */
const Promise = require('bluebird')
const _ = require('lodash')

const { subMonths, addDays, addMinutes, startOfMonth, endOfMonth } = require('date-fns')
const { resultTreatmentStatusToId } = require('../src/shared/dictionary')

async function seedResultTreatment(knex) {
  const now = new Date()
  const treatmentStatusOnTreatmentId = await resultTreatmentStatusToId(
    'OnTreatment'
  )
  const treatmentStatusNotPossibleId = await resultTreatmentStatusToId(
    'NotPossible'
  )

  const queryBase = knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .where('rca.requiresTreatment', 1)
  const query = queryBase
    .clone()
    .where('rc.externalId', 'Detected')

  let result0 = await query
    .clone()
    .first('r.*')
  if (!result0) {
    result0 = await queryBase
      .clone()
      .first('r.*')
  }
  const { externalId } = result0
  const restData = _.omit(result0, ['id', 'endedOn', 'externalId', 'treatmentStatusLogId'])

  let cntNew = 0
  await Promise.all(
    // process 12 last months
    _.range(1, 12).map(async shift => {
      // middle of the previous months
      const prevMonth = subMonths(now, shift)
      const startedOn = startOfMonth(prevMonth)
      const endedOn = endOfMonth(prevMonth)
      const midMonth = addDays(startedOn, 14)
      const getResults = async () => query
        .clone()
        .leftOuterJoin('ResultTreatmentStatusLog as log', 'r.treatmentStatusLogId', 'log.id')
        .where('r.endedOn', '>=', startedOn)
        .where('r.endedOn', '<=', endedOn)
        .select('r.*', 'log.resultTreatmentStatusId')
      let results = await getResults()
      // ----------
      // if too few results - add more to have at least 100 results per month
      if (results.length < 100) {
        await Promise.all(
          _.range(_.random(100, 150) - results.length).map(async () => {
            cntNew += 1
            await knex('Result').insert({
              ...restData,
              externalId: `${externalId}---${cntNew}`,
              endedOn: addMinutes(
                addDays(midMonth, _.random(-10, 10)), // range +-10 days from mid month
                _.random(-240, 240) // +-4 hours
              )
            })
          })
        )
        results = await getResults()
      }
      // ----------
      // assume 100 results each month - 40-70 of them should be 'on treatment', 10-15 - unaccountable
      // ----------
      const cntTotal = results.length
      const cntTreatment = results.filter(x => x.resultTreatmentStatusId === treatmentStatusOnTreatmentId).length
      const cntUnaccountable = results.filter(x => x.resultTreatmentStatusId === treatmentStatusNotPossibleId).length
      const pcTreatments = 100 * cntTreatment / cntTotal
      const pcUnaccountables = 100 * cntUnaccountable / cntTotal
      let index = 0
      const resultsFree = results.filter(x => !x.resultTreatmentStatusId)
      const addLogs = (cntDiff, resultTreatmentStatusId) => 
        _.range(cntDiff).map(async () => {
          index += 1
          const { id: resultId } = resultsFree[index] || {}
          if (resultId) {
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
      
      if (pcTreatments < 40) {
        await Promise.all(
          addLogs(_.random(40, 70) - pcTreatments, treatmentStatusOnTreatmentId)
        )
      }
      if (pcUnaccountables < 10) {
        await Promise.all(
          addLogs(_.random(10, 15) - pcUnaccountables, treatmentStatusNotPossibleId)
        )
      }
    })
  )
}

module.exports = {
  seedResultTreatment,
}
