const Promise = require('bluebird')
const _ = require('lodash')

const { subMonths, startOfMonth, endOfMonth } = require('date-fns')
const { resultTreatmentStatusToId } = require('../../src/shared/dictionary')
const { getPermissionModules } = require('../utils')
const { setUserPermission } = require('../../src/shared/permissions')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const modules = await getPermissionModules(knex)
  const now = new Date()
  const treatmentStatusOnTreatmentId = await resultTreatmentStatusToId('OnTreatment')
  const treatmentStatusNotPossibleId = await resultTreatmentStatusToId('NotPossible')

  const users = ['myanmar_admin', 'admin', 'reporter_admin']
  await Promise.each(users, async userName => {
    // ------------------------------------------------------
    // make sure specified users have permissions to see Treatment Graph
    // ------------------------------------------------------
    const { partnerId } = await setUserPermission(
      knex,
      userName,
      'Admin', // jobFunctionName
      modules.treatmentStatus.edit // permissionId
    )

    // ------------------------------------------------------
    // make sure current results have 'OnTreatment' and 'NotPossible' logs,
    // and their sum is less than total results per month
    // ------------------------------------------------------
    const query = knex('Result as r')
      .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
      .innerJoin('ResultCategoryAssay as rca', function () {
        this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
      })
      .where('rca.requiresTreatment', 1)
      .where('r.partnerId', partnerId)

    // process 12 last months
    await Promise.each(_.range(1, 12), async shift => {
      const prevMonth = subMonths(now, shift)
      const startedOn = startOfMonth(prevMonth)
      const endedOn = endOfMonth(prevMonth)
      // get results for current month
      const results = await query
        .clone()
        .leftOuterJoin('ResultTreatmentStatusLog as log', 'r.treatmentStatusLogId', 'log.id')
        .where('r.endedOn', '>=', startedOn)
        .where('r.endedOn', '<=', endedOn)
        .select('r.*', 'log.resultTreatmentStatusId')
      // ----------------------
      // helper functions
      // ----------------------
      const updateResultTable = async (result, resultTreatmentStatusId = null, treatmentStatusLogId = null) => {
        const { id: resultId } = result
        // set props for local 'result' item
        result.resultTreatmentStatusId = resultTreatmentStatusId
        result.treatmentStatusLogId = treatmentStatusLogId
        // update Result table
        await knex('Result')
          .update({
            treatmentStatusLogId,
          })
          .where({ id: resultId })
      }
      // ----------------------
      const addLogs = async (cntDiff, resultTreatmentStatusId) => {
        // get results un-assigned to any treatment status
        const resultsFree = results.filter(x => !x.resultTreatmentStatusId)
        await Promise.each(_.range(cntDiff), async index => {
          const result = resultsFree[index]
          if (result) {
            const { id: resultId } = result
            // insert in ResultTreatmentStatusLog
            const [treatmentStatusLogId] = await knex('ResultTreatmentStatusLog').insert({
              resultId,
              resultTreatmentStatusId,
              changedOn: now,
              createdOn: now,
            })
            // update Result
            await updateResultTable(result, resultTreatmentStatusId, treatmentStatusLogId)
          }
        })
      }
      // ----------------------
      const removeLogs = (cntDiff, scopeResults) =>
        Promise.each(_.range(cntDiff), async index => {
          const result = scopeResults[index]
          if (result) {
            const { id: resultId } = result
            // remove from ResultTreatmentStatusLog
            await knex('ResultTreatmentStatusLog').where({ resultId }).del()
            // update Result
            await updateResultTable(result)
          }
        })
      // ----------------------
      const addIfTooLittle = async (scopeResults, pcMin, pcMax, treatmentStatusId) => {
        const pcCurrentStatus = (100 * scopeResults.length) / cntTotal
        if (pcCurrentStatus < pcMin) {
          const pcNewStatus = _.random(pcMin, pcMax)
          const cntDiff = Math.round((pcNewStatus - pcCurrentStatus) * cntTotal) / 100
          if (cntDiff > 0) {
            await addLogs(cntDiff, treatmentStatusId)
          }
        }
      }
      // ----------------------
      const releaseIfTooMany = async (scopeResults, pcMax) => {
        const pcCurrentStatus = (100 * scopeResults.length) / cntTotal
        // if too many
        if (pcCurrentStatus > pcMax) {
          const cntDiff = Math.round((pcCurrentStatus - pcMax) * cntTotal) / 100
          if (cntDiff > 0) {
            await removeLogs(cntDiff, scopeResults)
          }
        }
      }
      // ----------------------
      // set 'OnTreatment' and 'NotPossible' to be in % range
      // ----------------------
      const cntTotal = results.length
      const resultsOnTreatment = results.filter(x => x.resultTreatmentStatusId === treatmentStatusOnTreatmentId)
      const resultsNotPossible = results.filter(x => x.resultTreatmentStatusId === treatmentStatusNotPossibleId)
      if (cntTotal > 0) {
        // remove from log table if percentage exceeds max %
        await releaseIfTooMany(resultsOnTreatment, 60) // max %
        await releaseIfTooMany(resultsNotPossible, 25) // max %

        // set 'OnTreatment' to be in % range
        await addIfTooLittle(
          resultsOnTreatment,
          40, // min %
          60, // max %
          treatmentStatusOnTreatmentId
        )
        // set 'NotPossible' to be in % range
        await addIfTooLittle(
          resultsNotPossible,
          15, // min %
          25, // max %
          treatmentStatusNotPossibleId
        )
      }
    })
  })
}
