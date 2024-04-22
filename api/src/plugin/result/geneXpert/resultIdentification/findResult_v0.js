const _ = require('lodash')
const matchTypeConstant = require('../resultMatchType')

const ALGORITHM_VERSION_V0 = '0.0.0'

/** Plugable logic to find a result.
 * v0 algorithm: Follows Aspect original logic, previously in `deviceApi/result.js`->`findExistingResult` method.
 * @param {Object} availableResultDetails - Details of the result to be found, can receive a GxConnect payload.
 * @param {number} availableResultDetails.partnerId - The partner id.
 * @param {string} availableResultDetails.gxAlertUniqueId - The unique identifier of the result following GxAlert practice.
 * @param {string} availableResultDetails.cartridgeSerial - The serial number of the consumable used to generate the result.
 * @param {string} availableResultDetails.instrumentSerial - The serial number of the instrument used to generate the result.
 * @param {Array} availableResultDetails.potentialSampleIds - Array of possible sample ids.
 * @param {number} availableResultDetails.siteId - The site id.
 * @param {Array} availableResultDetails.potentialAssayIds - Array of possible assay ids.
 * @param {Date} availableResultDetails.startedOn - The date the result was started.
 * @param {Object} knex - The knex instance to be used to query the database.
 * @returns {Promise<{matchingResult: Object, algorithm: string, possibleDuplicates: Array, matchType: string}>} - The result found, the algorithm version used, possible duplicates and the match type.
 * @property {Object} matchingResult - The result found.
 * @property {string} algorithm - version of this algorithm: '0.0.0'.
 * @property {Array} possibleDuplicates - Always an empty array as this is a deprecated algorithm.
 * @property {string} matchType - Always matchTypeConstant.NOT_REGISTERED as this is a deprecated algorithm.
 */
async function findResult(availableResultDetails, knex) {
  const {
    partnerId,
    geneXpertTestId = null, // GxConnect -> GxAlert -> Aspect: result.data.id, GxConnect -> Aspect: result.id
    gxAlertUniqueId = null, // GxConnect/Listener -> GxAlert -> Aspect: result.data.gxAlertTestUniqueId
    cartridgeSerial = null, // GxAlert -> Aspect: result.consumable.serial
    instrumentSerial = null, // GxAlert -> Aspect: result.instrument.serial
    potentialSampleIds = [],
    siteId = null,
    potentialAssayIds = [],
    startedOn = null,
  } = availableResultDetails

  const selectFields = [
    'r.id',
    'r.externalId',
    'r.resultData',
    'r.siteId',
    'rc1.externalId as resultCategory1',
    'rc2.externalId as resultCategory2',
    'a.externalId as assayId',
    's.externalId as sampleId',
    knex.raw('r.resultData->>"$.geneXpertTestId" as geneXpertTestId'),
  ]
  const queryStart = knex
    .from('Result as r')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .where('r.partnerId', partnerId)
  const matchType = matchTypeConstant.NO_MATCH
  let matchingResults = []
  let matchingResult = null
  if (gxAlertUniqueId) {
    matchingResults = await queryStart.clone().andWhere('r.externalId', gxAlertUniqueId).select(selectFields)
  }
  if (matchingResults.length === 1) {
    ;[matchingResult] = matchingResults
  } else if (matchingResults.length > 1 && geneXpertTestId) {
    matchingResults = _.filter(
      matchingResults,
      result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
    )
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1 && gxAlertUniqueId) {
      matchingResults = _.filter(matchingResults, {
        externalId: gxAlertUniqueId,
      })
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && geneXpertTestId) {
    matchingResults = await queryStart.clone().andWhere('r.externalId', geneXpertTestId).select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      matchingResults = _.filter(
        matchingResults,
        result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && cartridgeSerial && instrumentSerial && cartridgeSerial.length > 5) {
    matchingResults = await queryStart
      .clone()
      .andWhere('r.consumableSerial', cartridgeSerial)
      .andWhere('r.instrumentSerial', instrumentSerial)
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      matchingResults = _.filter(
        matchingResults,
        result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }
  if (
    _.isEmpty(matchingResult) &&
    !_.isEmpty(_.filter(potentialSampleIds, elem => elem)) &&
    siteId &&
    !_.isEmpty(_.filter(potentialAssayIds, elem => elem)) &&
    startedOn
  ) {
    matchingResults = await queryStart
      .clone()
      .whereIn('s.externalId', potentialSampleIds)
      .andWhere('r.siteId', siteId)
      .whereIn('a.externalId', potentialAssayIds)
      .andWhere('r.startedOn', startedOn)
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      if (geneXpertTestId) {
        matchingResults = _.filter(
          matchingResults,
          result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
        )
      }
      if (matchingResults.length > 1) {
        if (geneXpertTestId) {
          matchingResults = _.filter(matchingResults, result => result.externalId === geneXpertTestId)
        }
      }
      if (matchingResults.length > 1) {
        if (!_.isEmpty(potentialSampleIds) && siteId && !_.isEmpty(potentialAssayIds)) {
          matchingResults = _.filter(
            matchingResults,
            result =>
              potentialSampleIds.includes(result.sampleId) &&
              result.siteId === siteId &&
              potentialAssayIds.includes(result.assayId)
          )
        }
      }
      if (matchingResults.length > 1) {
        if (cartridgeSerial && instrumentSerial) {
          matchingResults = _.filter(
            matchingResults,
            result => result.consumableSerial === cartridgeSerial && result.instrumentSerial === instrumentSerial
          )
        }
      }
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }
  // if we find an existing result we are going to add an extra validation to compare the externalId or
  // the genexpert test id which is generated by the devices. If match with one of them we are going to take that as a match.
  // if not we are not going to take that as a match.
  // [Ahernandez 2024-04-01]: this step eventually generates duplicates, it will be removed when replacing this with algorithm v1
  if (
    !_.isEmpty(matchingResult) &&
    (!geneXpertTestId || !matchingResult.geneXpertTestId || _.isEqual(geneXpertTestId, matchingResult.geneXpertTestId))
  ) {
    return {
      matchingResult,
      algorithm: ALGORITHM_VERSION_V0,
      possibleDuplicates: [],
      matchType: matchTypeConstant.NOT_REGISTERED,
    }
  }
  return {
    matchingResult,
    algorithm: ALGORITHM_VERSION_V0,
    possibleDuplicates: [],
    matchType,
  }
}

module.exports = { findResult }
