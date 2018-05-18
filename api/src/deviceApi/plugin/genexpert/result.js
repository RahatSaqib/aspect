const _ = require('lodash')

async function findExistingResult(availableResultDetails, knex) {
  const {
    partnerId,
    geneXpertTestId = null, // GxConnect -> GxAlert -> Aspect: result.data.id, GxConnect -> Aspect: result.id
    gxAlertUniqueId = null, // GxConnect/Listener -> GxAlert -> Aspect: result.data.gxAlertTestUniqueId
    cartridgeSerial = null, // GxAlert -> Aspect: result.consumable.serial
    instrumentSerial = null, // GxAlert -> Aspect: result.instrument.serial
  } = availableResultDetails
  const selectFields = ['r.id', 'r.externalId', 'r.resultData']
  const queryStart = knex.from('Result as r').where('r.partnerId', partnerId)
  let matchingResults = []
  let matchingResult = null
  if (gxAlertUniqueId) {
    matchingResults = await queryStart
      .clone()
      .andWhere('r.externalId', gxAlertUniqueId)
      .select(selectFields)
  }
  if (matchingResults.length === 1) {
    ;[matchingResult] = matchingResults
  } else if (matchingResults.length > 1 && geneXpertTestId) {
    matchingResults = _.filter(
      matchingResults,
      result =>
        _.get(JSON.parse(result.resultData), 'geneXpertTestId') ===
        geneXpertTestId
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
    matchingResults = await queryStart
      .clone()
      .andWhereRaw(
        'JSON_EXTRACT(r.resultData, "$.geneXpertTestId") = ?',
        geneXpertTestId
      )
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    }
    if (matchingResults.length > 1 && gxAlertUniqueId) {
      matchingResults = _.filter(matchingResults, {
        externalId: gxAlertUniqueId,
      })
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && geneXpertTestId) {
    matchingResults = await queryStart
      .clone()
      .andWhere('r.externalId', geneXpertTestId)
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      matchingResults = _.filter(
        matchingResults,
        result =>
          _.get(JSON.parse(result.resultData), 'geneXpertTestId') ===
          geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && cartridgeSerial && instrumentSerial) {
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
        result =>
          _.get(JSON.parse(result.resultData), 'geneXpertTestId') ===
          geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }
  return matchingResult
}

module.exports = { findExistingResult }
