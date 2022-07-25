module.exports = require('../utils').seed(seed, __filename)
const _ = require('lodash')
const Promise = require('bluebird')
const { getUniqueId } = require('../utils')
const { addCase } = require('../../src/case/service')

async function seed(knex) {
  const results = await knex('Result as r')
    .join('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn(function () {
        this.on('r.resultCategory1', 'rca.resultCategoryId').orOn('r.resultCategory2', 'rca.resultCategoryId')
      })
    })
    .whereNull('r.patientCaseId')
    .andWhere('rca.reportable', 1)
    .select('r.id', 'r.partnerId', 'r.assayId')
  const assayDiseases = await knex('Assay as a')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .select('a.id', 'at.diseaseId')
  const assayIdDiseaseIdMap = assayDiseases.reduce((accumulator, assayDisease) => {
    accumulator[assayDisease.id] = assayDisease.diseaseId
    return accumulator
  }, {})
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const cases = []
  await Promise.each(
    results.filter(result => !!assayIdDiseaseIdMap[result.assayId]),
    async result => {
      if (_.random(100) <= 50) {
        const caseExternalId = `CASE-${getUniqueId()}-ID`
        const caseId = await addCase({
          externalId: caseExternalId,
          diseaseId: assayIdDiseaseIdMap[result.assayId],
          partnerId: result.partnerId,
          createdBy: adminId,
          updatedBy: adminId,
        })
        cases.push(caseId)
        if (_.random(100) <= 50) {
          result.patientCaseId = _.sample(cases)
        } else {
          result.patientCaseId = caseId
        }
        await knex('Result').update({ patientCaseId: result.patientCaseId }).where({ id: result.id })
      }
    }
  )
}
