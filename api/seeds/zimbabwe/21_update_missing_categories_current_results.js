module.exports = require('../utils').seed(seed, __filename)

const {
  allResultCategoryToId,
  assayToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  // result categories
  const {
    LessThan1000: resultCategoryLessThan1000,
    MoreThan1000: resultCategoryMoreThan1000,
  } = await allResultCategoryToId()
  const assayId = await assayToId('GxHiv1Vl')

  await knex('Result')
    .update(
      'resultCategory1',
      knex.raw(
        `IF(
          CAST(
            LTRIM(
              RTRIM(
                REPLACE(
                  REPLACE(
                    SUBSTR(
                      SUBSTR(resultData ->> '$.resultText',
                        LENGTH('HIV-1 DETECTED ')
                      ),1,INSTR(
                            SUBSTR(resultData ->> '$.resultText',
                                  LENGTH('HIV-1 DETECTED ')
                          ),'copies/mL')-1
                    ),
                  '<',''),
                '>','')
              )
            ) 
          AS DECIMAL)
        <1000,${resultCategoryLessThan1000},${resultCategoryMoreThan1000}
        )`
      )
    )
    .where({ assayId })
    .andWhere(
      knex.raw("resultData ->>'$.resultText'"),
      'LIKE',
      'HIV-1 DETECTED %'
    )
}
