const _ = require('lodash')

const { subMonths, startOfMonth, endOfMonth } = require('date-fns')
const { resultTreatmentStatusToId } = require('../../src/shared/dictionary')
const { getPermissionModules } = require('../utils')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const modules = await getPermissionModules(knex)
  const now = new Date()
  const treatmentStatusOnTreatmentId = await resultTreatmentStatusToId(
    'OnTreatment'
  )
  const treatmentStatusNotPossibleId = await resultTreatmentStatusToId(
    'NotPossible'
  )

  // make sure current results have 'OnTreatment' and 'NotPossible' logs,
  // and their sum is less than total results per month
  const query = knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .where('rca.requiresTreatment', 1)

  await Promise.all(
    // process 12 last months
    _.range(1, 12).map(async shift => {
      const prevMonth = subMonths(now, shift)
      const startedOn = startOfMonth(prevMonth)
      const endedOn = endOfMonth(prevMonth)
      // get results for current month
      const results = await query
        .clone()
        .leftOuterJoin(
          'ResultTreatmentStatusLog as log',
          'r.treatmentStatusLogId',
          'log.id'
        )
        .where('r.endedOn', '>=', startedOn)
        .where('r.endedOn', '<=', endedOn)
        .select('r.*', 'log.resultTreatmentStatusId')
      // ----------------------
      // helper functions
      // ----------------------
      const addLogs = (cntDiff, resultTreatmentStatusId) => {
        // get results un-assigned to any treatment status
        const resultsFree = results.filter(x => !x.resultTreatmentStatusId)
        return _.range(cntDiff).map(async index => {
          const result = resultsFree[index]
          if (result) {
            const { id: resultId } = result
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
            result.treatmentStatusLogId = treatmentStatusLogId
            await knex('Result')
              .update({
                treatmentStatusLogId,
              })
              .where({ id: resultId })
          }
        })
      }
      const removeLogs = (cntDiff, scopeResults) =>
        _.range(cntDiff).map(async index => {
          const result = scopeResults[index]
          if (result) {
            const { id: resultId } = result
            // remove from ResultTreatmentStatusLog
            await knex('ResultTreatmentStatusLog')
              .where({ resultId })
              .del()
            // update Result
            result.treatmentStatusLogId = null
            await knex('Result')
              .update({ treatmentStatusLogId: null })
              .where({ id: resultId })
          }
        })
      const normalizeTreatments = async (
        pcCurrentStatus,
        pcMax,
        pcMin,
        treatmentStatusId,
        scopeResults
      ) => {
        const pcNewStatus = _.random(pcMin, pcMax)
        let cntDiff
        // if too little
        if (pcCurrentStatus < pcMin) {
          cntDiff = Math.floor((pcNewStatus - pcCurrentStatus) * cntTotal) / 100
          if (cntDiff > 0) {
            await Promise.all(addLogs(cntDiff, treatmentStatusId))
          }
        }
        // if too many
        if (pcCurrentStatus > pcMax) {
          cntDiff = Math.floor((pcCurrentStatus - pcNewStatus) * cntTotal) / 100
          if (cntDiff > 0) {
            await Promise.all(removeLogs(cntDiff, scopeResults))
          }
        }
      }
      // ----------
      // set 'OnTreatment' and 'NotPossible' to be in % range
      // ----------
      const cntTotal = results.length
      const resultsOnTreatment = results.filter(
        x => x.resultTreatmentStatusId === treatmentStatusOnTreatmentId
      )
      const resultsNotPossible = results.filter(
        x => x.resultTreatmentStatusId === treatmentStatusNotPossibleId
      )
      if (cntTotal > 0) {
        // set 'OnTreatment' to be in % range
        await normalizeTreatments(
          (100 * resultsOnTreatment.length) / cntTotal, // pcOnTreatment
          50, // min %
          60, // max %
          treatmentStatusOnTreatmentId,
          resultsOnTreatment
        )
        // set 'NotPossible' to be in % range
        await normalizeTreatments(
          (100 * resultsNotPossible.length) / cntTotal, // pcNotPossible
          10, // min %
          15, // max %
          treatmentStatusNotPossibleId,
          resultsNotPossible
        )
      }
    })
  )

  // make sure specified users have permissions to see Treatment Graph
  const users = ['myanmar_admin', 'admin']
  await Promise.all(
    users.map(async userName => {
      // Country, Person
      const {
        id: personId,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
      } = await knex('Person as p')
        .innerJoin('User as u', 'p.userId', 'u.id')
        .where('u.name', userName)
        .first('p.*')
      // Geography
      const { id: geographyId } = await knex('Geography')
        .where({ countryId })
        .whereNull('stateId')
        .whereNull('lgaId')
        .first()
      // JobFunction
      const { id: jobFunctionId } = await knex('JobFunction')
        .where({ partnerId, name: 'Admin' })
        .first()
      // Job
      let { id: jobId } =
        (await knex('Job')
          .where({ personId, jobFunctionId })
          .first()) || {}
      if (!jobId) {
        ;[jobId] = await knex('Job').insert({
          personId,
          jobFunctionId,
        })
      }
      // JobContext
      const jobContext = await knex('JobContext')
        .where({ jobId, geographyId })
        .whereNull('siteId')
        .first()
      if (!jobContext) {
        await knex('JobContext').insert({
          jobId,
          geographyId,
          siteId: null,
        })
      }
      // JobFunctionPermission
      const jobFunctionPermission = await knex('JobFunctionPermission')
        .where({ permissionId: modules.treatmentStatus.admin, jobFunctionId })
        .first()
      if (!jobFunctionPermission) {
        await knex('JobFunctionPermission').insert({
          jobFunctionId,
          permissionId: modules.treatmentStatus.admin,
        })
      }
    })
  )
}
