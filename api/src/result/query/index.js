const { addConstraints } = require('../../auth/constraints')

/**
 *  Builds a knex query including all the necessary joins for scoping results to the data constraints
 * @param {*} knex
 * @param {*} dataConstraints
 */
const getBaseQuery = (knex, dataConstraints) =>
  knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      geography: 'g',
      site: 'si',
    })

/**
 * const SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY = {
  // Flat mtb cnt
  mtbNotDetected: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'NotDetected' THEN 1 ELSE 0 END)"
  ),
  mtbDetected: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'Detected' THEN 1 ELSE 0 END)"
  ),
  mtbNoResult: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'NoResult' THEN 1 ELSE 0 END)"
  ),
  mtbInvalid: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'Invalid' THEN 1 ELSE 0 END)"
  ),
  mtbError: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'Error' THEN 1 ELSE 0 END)"
  ),

  // Flat rif cnt
  rifDetected: knex.raw(
    "SUM(CASE WHEN rc2.externalId = 'Detected' THEN 1 ELSE 0 END)"
  ),
  rifNotDetected: knex.raw(
    "SUM(CASE WHEN rc2.externalId = 'NotDetected' THEN 1 ELSE 0 END)"
  ),
  rifIndeterminate: knex.raw(
    "SUM(CASE WHEN rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END)"
  ),

  // Flat groups cnt
  mtbDetectedRifNotDetected: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'NotDetected' THEN 1 ELSE 0 END)"
  ),
  mtbDetectedRifDetected: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'Detected' THEN 1 ELSE 0 END)"
  ),
  mtbDetectedNoRif: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END)"
  ),
  mtbTraceNoRif: knex.raw(
    "SUM(CASE WHEN rc1.externalId = 'Trace Detected' AND rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END)"
  ),
  // Grouped mtb cnt
  mtbValid: knex.raw(
    "SUM(CASE WHEN rc1.externalId NOT IN ('NoResult', 'Indeterminate', 'Error', 'Invalid') THEN 1 ELSE 0 END)"
  ),
  mtbInconclusive: knex.raw(
    "SUM(CASE WHEN rc1.externalId IN ('NoResult', 'Indeterminate', 'Error', 'Invalid') THEN 1 ELSE 0 END)"
  ),
}
 */

const modifiers = {
  join: {
    resultCategory1: queryBuilder => {
      queryBuilder.leftJoin(
        'ResultCategory as rc1',
        'r.resultCategory1',
        'rc1.id'
      )
    },
    resultCategory2: queryBuilder => {
      queryBuilder.leftJoin(
        'ResultCategory as rc2',
        'r.resultCategory2',
        'rc2.id'
      )
    },
  },
  where: {
    module: {
      /**
       * Excludes the results which module has been replaced
       * @param {*} queryBuilder
       */
      isActive: queryBuilder => {
        queryBuilder
          .leftJoin('Result as rLaterModuleSerial', joinQuery => {
            joinQuery
              .on('r.moduleName', 'rLaterModuleSerial.moduleName')
              .andOn('r.deviceId', 'rLaterModuleSerial.deviceId')
              .andOn('r.moduleSerial', '!=', 'rLaterModuleSerial.moduleSerial')
              .andOn('r.endedOn', '<', 'rLaterModuleSerial.endedOn')
          })
          .whereNull('rLaterModuleSerial.id')
      },
    },
  },
}

module.exports = {
  getBaseQuery,
  modifiers,
}
