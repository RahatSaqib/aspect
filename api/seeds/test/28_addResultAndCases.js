module.exports = require('../utils').seed(seed, __filename)
const _ = require('lodash')
const Promise = require('bluebird')
const { addCase } = require('../../src/case/service')

async function seed(knex) {
  const { id: userId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  const results = await knex('Result')
    .whereNull('caseId')
    .select()
  const assayIdDiseaseIdMap = await knex('Assay as a')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .select('a.id', 'at.diseaseId')
    .reduce((accumulator, assayDisease) => {
      accumulator[assayDisease.id] = assayDisease.diseaseId
      return accumulator
    }, {})
  const cases = []
  // From the 100% of the results it will take the 50% of them to assign a caseid
  // and from that portion the 50% it will have the same caseid
  await Promise.each(results, async result => {
    if (_.random(100) <= 50) {
      const uid = _.random(100000, 999999)
      const caseExternalId = `CASE-${uid}-ID`
      const caseId = await addCase({
        externalId: caseExternalId,
        partnerId: result.partnerId,
        diseaseId: assayIdDiseaseIdMap[result.assayId],
        createdBy: userId,
        updatedBy: userId,
      })
      cases.push(caseId)
      if (_.random(100) <= 50) {
        result.caseId = _.sample(cases)
      } else {
        result.caseId = caseId
      }
      await knex('Result')
        .update({ id: result.id, caseId: result.caseId })
        .where({ id: result.id })
    }
  })
}
