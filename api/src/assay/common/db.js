const { addConstraints } = require('../../auth/constraints')
const { knex } = require('../../db')

const getAssay = async id => {
  return knex('Assay').where({ id }).first()
}

// get all assays that have results that user has access to
const usedAssay = dataConstraints => {
  return knex('FactResultsDeviceByAssay as f')
    .innerJoin('Device as d', 'f.deviceId', 'd.id')
    .innerJoin('Assay as a', 'f.assayId', 'a.id')
    .modify(addConstraints, dataConstraints, { device: 'd', assay: 'a' })
    .where('f.resultCount', '>', 0)
    .groupBy('f.assayId')
    .select({
      assayId: 'f.assayId',
      resultCount: knex.raw('SUM(f.resultCount)'),
    })
}

module.exports = {
  getAssay,
  usedAssay,
}
