const _ = require('lodash')
const { createUniqueIdForResult } = require('../../../result/service')

async function findExistingResult(availableResultDetails, knex) {
  const {
    externalId,
    startedOn,
    endedOn,
    instrumentSerial,
    sampleId,
    partnerId,
    geneXpertTestId, // GxConnect -> GxAlert -> Aspect: result.data.id, GxConnect -> Aspect: result.id
    gxAlertUniqueId, // GxConnect/Listener -> GxAlert -> Aspect: result.data.gxAlertTestUniqueId
  } = availableResultDetails
  const selectFields = ['r.id', 'r.externalId', 'r.resultData']
  const queryStart = knex.from('Result as r').where('r.partnerId', partnerId)
  let matchingResults = []
  let matchingResult = null
  if (externalId) {
    matchingResults = await queryStart
      .clone()
      .andWhere('r.externalId', externalId)
      .select(selectFields)
  }
  if (matchingResults.length === 1) {
    ;[matchingResult] = matchingResults
  }
  const generatedExternalId = createUniqueIdForResult(
    instrumentSerial,
    startedOn,
    endedOn,
    sampleId
  )
  if (_.isEmpty(matchingResult) && generatedExternalId) {
    if (generatedExternalId) {
      matchingResults = await queryStart
        .clone()
        .andWhere('r.externalId', generatedExternalId)
        .select(selectFields)
    }
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

  if (_.isEmpty(matchingResult) && gxAlertUniqueId) {
    matchingResults = await await queryStart
      .clone()
      .andWhere('r.externalId', gxAlertUniqueId)
      .select(selectFields)
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
      }
    }
  }

  if (_.isEmpty(matchingResult) && geneXpertTestId) {
    matchingResults = await await queryStart
      .clone()
      .andWhereRaw(
        'JSON_EXTRACT(r.resultData, "$.geneXpertTestId") = ?',
        geneXpertTestId
      )
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    }
    if (matchingResults.length > 1 && generatedExternalId) {
      matchingResults = _.filter(matchingResults, {
        externalId: generatedExternalId,
      })
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
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
  return matchingResult
}

module.exports = { findExistingResult }
