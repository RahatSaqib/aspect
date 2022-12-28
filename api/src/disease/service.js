const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listDiseases(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const usedDiseaseIdsQuery = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      result: 'r',
      disease: 'dis',
      assay: 'a',
    })
    .distinct('dis.id as diseaseId')

  const diseases = await knex('Disease as d')
    .modify(addConstraints, dataConstraints, {
      disease: 'd',
    })
    .select()
  const usedDiseaseIds = await usedDiseaseIdsQuery

  const result = {
    ok: true,
    total: diseases.length,
    length: diseases.length,
    data: _.map(diseases, elem => ({
      ...elem,
      hasResults: usedDiseaseIds.some(d => d.diseaseId === elem.id),
    })),
  }
  return result
}

module.exports = {
  listDiseases,
}
