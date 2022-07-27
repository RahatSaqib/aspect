const Promise = require('bluebird')

async function seed(knex) {
  // For GeneXpert TB assays, only results that have result1 as
  // either Detected, Trace Detected, Error, Invalid, No Result or Success can have a result2.
  // See also gxutils.js, "canHaveSecondResult"
  // Set all others to null
  const resultsCategories = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .whereNotIn('rc.externalId', ['Detected', 'Trace Detected', 'Error', 'Invalid', 'NoResult', 'Success'])
    .whereNotNull('r.resultCategory2')
    .select('r.id')

  await Promise.each(resultsCategories, result => knex('Result').where('id', result.id).update('resultCategory2', null))

  // For all assays, the result cannot have an error code unless result1 is either Invalid, No Result, or Error
  const resultsErrorCodes = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .whereNotIn('rc.externalId', ['Invalid', 'NoResult', 'Error'])
    .whereNotNull('r.errorCode')
    .select('r.id')

  await Promise.each(resultsErrorCodes, result => knex('Result').where('id', result.id).update('errorCode', null))
}

module.exports = seed
