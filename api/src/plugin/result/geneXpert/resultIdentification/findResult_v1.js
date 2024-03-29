const matchTypeConstant = require('../resultMatchType')

const ALGORITHM_VERSION_V1 = '1.0.0'

/** Plugable logic to find a result.
 * v1 algorithm: Follows GxAlert practice, looking for a result by GxAlert style externalId, fallback to instrumentSerial and consumableSerial.
 * @param {Object} availableResultDetails - Details of the result to be found, can receive a GxConnect payload.
 * @param {number} availableResultDetails.partnerId - The partner id.
 * @param {string} availableResultDetails.gxAlertUniqueId - The unique identifier of the result following GxAlert practice.
 * @param {string} availableResultDetails.cartridgeSerial - The serial number of the consumable used to generate the result.
 * @param {string} availableResultDetails.instrumentSerial - The serial number of the instrument used to generate the result.
 * @param {Object} knex - The knex instance to be used to query the database.
 * @returns {Promise<{matchingResult: Object, algorithm: string, possibleDuplicates: Array, matchType: string}>} - The result found, the algorithm version used, possible duplicates and the match type.
 * @property {Object} matchingResult - The result found.
 * @property {string} algorithm - version of this algorithm: '1.0.0'.
 * @property {Array} possibleDuplicates - Array of Possible duplicate results.
 * @property {string} matchType - The match type: {@link ../resultMatchType.js}.
 */
async function findResult(availableResultDetails, knex) {
  const {
    partnerId,
    gxAlertUniqueId,
    cartridgeSerial: consumableSerial = null,
    instrumentSerial = null,
  } = availableResultDetails

  let query
  try {
    query = generateDbQuery(knex, partnerId, gxAlertUniqueId, consumableSerial, instrumentSerial)
  } catch (error) {
    return {
      matchingResult: null,
      algorithm: ALGORITHM_VERSION_V1,
      possibleDuplicates: [],
      matchType: matchTypeConstant.MISSING_RESULT_DATA,
    }
  }

  const queryResult = await query.then(rows => rows)
  const matchingResults = queryResult.sort(oldestIsBetter)

  let matchingResult = null
  let matchType = matchTypeConstant.NO_MATCH
  let possibleDuplicates = []

  const exactMatch = matchingResults.filter(
    r =>
      r.externalId === gxAlertUniqueId &&
      r.instrumentSerial === instrumentSerial &&
      r.consumableSerial === consumableSerial
  )

  if (exactMatch.length > 0) {
    ;[matchingResult] = exactMatch
    matchType = matchTypeConstant.EXACT_MATCH
  } else {
    const matchsByExternalIdOnly = matchingResults.filter(result => result.externalId === gxAlertUniqueId)

    if (matchsByExternalIdOnly.length > 0) {
      ;[matchingResult] = matchsByExternalIdOnly
      matchType = matchTypeConstant.ONLY_EXTERNAL_ID
    }

    if (!matchingResult && instrumentSerial && consumableSerial) {
      const filteredByConsumable = matchingResults.filter(
        result => result.instrumentSerial === instrumentSerial && result.consumableSerial === consumableSerial
      )
      if (filteredByConsumable.length > 0) {
        ;[matchingResult] = filteredByConsumable
        matchType = matchTypeConstant.ONLY_CONSUMABLE
      }
    }
  }

  if (matchingResult && matchingResults.length > 1) {
    possibleDuplicates = matchingResults.filter(r => r.id !== matchingResult.id)
  }

  return {
    matchingResult,
    algorithm: ALGORITHM_VERSION_V1,
    possibleDuplicates,
    matchType,
  }
}

const oldestIsBetter = (a, b) => new Date(a.createdOn) - new Date(b.createdOn)

/**
 * Generates a database query to find a result based on the provided parameters.
 * @param {Object} knex - The Knex instance for executing the query.
 * @param {number} partnerId - The Id of the partner.
 * @param {string} gxAlertUniqueId - The uniqueId of the result in GXAlert format.
 * @param {string} consumableSerial - The serial number of the consumable.
 * @param {string} instrumentSerial - The serial number of the instrument.
 * @returns {Object} - A query builder object with the query.
 * @throws {Error} - If there is not enough data provided to find a result.
 */
function generateDbQuery(knex, partnerId, gxAlertUniqueId, consumableSerial, instrumentSerial) {
  const selectFields = [
    'r.id',
    'r.externalId',
    'r.resultData',
    'r.siteId',
    'rc1.externalId as resultCategory1',
    'rc2.externalId as resultCategory2',
    'a.externalId as assayId',
    's.externalId as sampleId',
    'r.instrumentSerial',
    'r.consumableSerial',
  ]

  let query = knex
    .select(selectFields)
    .from('Result as r')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .where('r.partnerId', partnerId)

  query = query.where(function () {
    if (gxAlertUniqueId) {
      this.where('r.externalId', gxAlertUniqueId)
    }
    if (consumableSerial && instrumentSerial && consumableSerial.length > 5) {
      this.orWhere(function () {
        this.where('r.instrumentSerial', instrumentSerial).andWhere('r.consumableSerial', consumableSerial)
      })
    } else {
      throw new Error('Not enough data to find a result')
    }
  })
  return query
}

module.exports = { findResult }
