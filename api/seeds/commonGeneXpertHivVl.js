const { allResultCategoryToId, assayToId } = require('../src/shared/dictionary')

const { upsertAssayResultCategories } = require('./common')

async function fixActualGeneXpertHivVlData(knex) {
  const {
    LessThan1000: resultCategoryLessThan1000,
    MoreThan1000: resultCategoryMoreThan1000,
    LessThan40: resultCategoryLessThan40,
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
        <1000,IF(
                INSTR(resultData->>'$.resultText','< 40') > 0,${resultCategoryLessThan40},${resultCategoryLessThan1000}
                ),${resultCategoryMoreThan1000}
        )`
      )
    )
    .update(
      'resultData',
      knex.raw(
        `JSON_INSERT(resultData,'$.copies',
          IF(INSTR(resultData->>'$.resultText','DETECTED < 40')>0 OR INSTR(resultData->>'$.resultText','copies')=0,NULL,
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
          ) 
        )`
      )
    )
    .where({ assayId })
    .andWhere(
      knex.raw("resultData ->>'$.resultText'"),
      'LIKE',
      'HIV-1 DETECTED %copies%'
    )

  await upsertAssayResultCategories(knex, assayId, ['LessThan40'])
}

module.exports = {
  fixActualGeneXpertHivVlData,
}
