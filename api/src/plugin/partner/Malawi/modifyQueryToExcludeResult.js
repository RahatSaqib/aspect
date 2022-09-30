function modifyQueryToExcludeResult(queryBuilder, constraints, aliases) {
  const {
    dictionary: { assayIds },
    result: resultAlias,
    assay: assayAlias,
  } = aliases

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
        IFNULL(${resultAlias}.resultData ->> '$.customFieldData."34".value', '') NOT IN ('EQA', 'PT')
      )
      OR
      (
        -- TB
        ${assayAlias}.id IN (${assayIds.GxMtbRif}, ${assayIds.GxMtbRifUltra})
        AND
        IFNULL(${resultAlias}.resultData ->> '$.customFieldData."7".value', '') NOT IN ('EQA', 'PT')
      )
    )`
  )
}

module.exports = modifyQueryToExcludeResult
