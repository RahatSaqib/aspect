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
      const getResults = async () =>
        query
          .clone()
          .leftOuterJoin(
            'ResultTreatmentStatusLog as log',
            'r.treatmentStatusLogId',
            'log.id'
          )
          .where('r.endedOn', '>=', startedOn)
          .where('r.endedOn', '<=', endedOn)
          .select('r.*', 'log.resultTreatmentStatusId')
      const results = await getResults()
      // ----------
      // 40%-70% of results should be 'on treatment', 10-15% - unaccountable
      // ----------
      const cntTotal = results.length
      const cntTreatment = results.filter(
        x => x.resultTreatmentStatusId === treatmentStatusOnTreatmentId
      ).length
      const cntUnaccountable = results.filter(
        x => x.resultTreatmentStatusId === treatmentStatusNotPossibleId
      ).length
      const pcTreatments = (100 * cntTreatment) / cntTotal
      const pcUnaccountables = (100 * cntUnaccountable) / cntTotal
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
          addLogs(
            _.random(10, 15) - pcUnaccountables,
            treatmentStatusNotPossibleId
          )
        )
      }
    })
  )

  // check/define permissions for user 'myanmar_admin'
  const userName = 'myanmar_admin'
  const countryName = 'Myanmar'
  // Country
  const { id: countryId } = await knex('Country')
    .where({ name: countryName })
    .first()
  // Geography
  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()
  // Person
  const { id: personId, lastPartnerId: partnerId } = await knex('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .where('u.name', userName)
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
}
