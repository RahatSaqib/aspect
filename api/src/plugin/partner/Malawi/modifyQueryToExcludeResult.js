const { getDictionarySync } = require('../../../shared/dictionary')

function modifyQueryToExcludeResult(queryBuilder, constraints, aliases) {
  const { result: resultAlias, assay: assayAlias, displayResult } = aliases
  const assayIds = getDictionarySync('Assay')

  if (displayResult === 'actual') {
    queryBuilder.whereRaw(
      `(
        ${assayAlias}.id NOT IN (
          -- HIV
          ${assayIds.GxHiv1Vl},
          ${assayIds.GxHiv1Qual},
          -- TB
          ${assayIds.GxMtbRif},
          ${assayIds.GxMtbRifUltra}
        )
        OR
        (
          -- HIV
          ${assayAlias}.id IN (${assayIds.GxHiv1Vl}, ${assayIds.GxHiv1Qual})
          AND
          IFNULL(${resultAlias}.resultData->>'$.customFieldData."34".value', '') NOT IN ('EQA', 'PT')
        )
        OR
        (
          -- TB
          ${assayAlias}.id IN (${assayIds.GxMtbRif}, ${assayIds.GxMtbRifUltra})
          AND
          IFNULL(${resultAlias}.resultData->>'$.customFieldData."7".value', '') NOT IN ('EQA', 'PT')
        )
      )`
    )
  } else if (displayResult === 'excluded') {
    queryBuilder.whereRaw(
      `(
        ${assayAlias}.id IN (
          -- HIV
          ${assayIds.GxHiv1Vl},
          ${assayIds.GxHiv1Qual},
          -- TB
          ${assayIds.GxMtbRif},
          ${assayIds.GxMtbRifUltra}
        )
        AND
        (
          (
            -- HIV
            ${assayAlias}.id IN (${assayIds.GxHiv1Vl}, ${assayIds.GxHiv1Qual})
            AND
            IFNULL(${resultAlias}.resultData->>'$.customFieldData."34".value', '') IN ('EQA', 'PT')
          )
          OR
          (
            -- TB
            ${assayAlias}.id IN (${assayIds.GxMtbRif}, ${assayIds.GxMtbRifUltra})
            AND
            IFNULL(${resultAlias}.resultData->>'$.customFieldData."7".value', '') IN ('EQA', 'PT')
          )
        )
      )`
    )
  }
}

module.exports = modifyQueryToExcludeResult
