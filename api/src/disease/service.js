const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listDiseases(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const diseases = await knex('Disease as dis')
    .modify(addConstraints, dataConstraints, {
      disease: 'dis',
    })
    .select('dis.*')
    .select({
      diseaseIdUsed: knex('Result as r')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .innerJoin('Assay as a', 'r.assayId', 'a.id')
        .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
        .innerJoin('Disease as disease', 'at.diseaseId', 'disease.id')
        .modify(addConstraints, dataConstraints, {
          device: 'd',
          result: 'r',
          disease: 'disease',
          assay: 'a',
        })
        .whereRaw('disease.id = dis.id')
        .select('disease.id')
        .limit(1),
    })

  const result = {
    ok: true,
    total: diseases.length,
    length: diseases.length,
    data: _.map(diseases, ({ diseaseIdUsed, ...rest }) => ({
      ...rest,
      hasResults: !!diseaseIdUsed,
    })),
  }
  return result
}

module.exports = {
  listDiseases,
}
