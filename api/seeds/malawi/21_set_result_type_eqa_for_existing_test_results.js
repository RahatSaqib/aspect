const { getDictionarySync } = require('../../src/shared/dictionary')

async function seed(knex) {
  const assayIds = getDictionarySync('Assay')

  const { id: resultTypeIdEqaId } = await knex('ResultType').where({ externalId: 'EQA' }).first('id')

  await knex('Result as r')
    .update({ resultTypeId: resultTypeIdEqaId })
    .whereRaw(
      `(
        r.assayId IN (
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
            r.assayId IN (${assayIds.GxHiv1Vl}, ${assayIds.GxHiv1Qual})
            AND
            IFNULL(r.resultData->>'$.customFieldData."34".value', '') IN ('EQA', 'PT')
          )
          OR
          (
            -- TB
            r.assayId IN (${assayIds.GxMtbRif}, ${assayIds.GxMtbRifUltra})
            AND
            IFNULL(r.resultData->>'$.customFieldData."7".value', '') IN ('EQA', 'PT')
          )
        )
      )`
    )
}

module.exports = require('../utils').seed(seed, __filename)
