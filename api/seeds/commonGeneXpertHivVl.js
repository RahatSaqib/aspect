const { allResultCategoryToId, assayToId } = require('../src/shared/dictionary')

const { upsertAssayResultCategories } = require('./common')

async function fixActualGeneXpertHivVlData(knex) {
  const {
    LessThan1000: resultCategoryLessThan1000,
    MoreThan1000: resultCategoryMoreThan1000,
    LessThan40: resultCategoryLessThan40,
    NoResult: resultCategoryNoResult,
    Success: resultCategorySuccess,
    NotDetected: resultCategoryNotDetected,
  } = await allResultCategoryToId()
  const assayId = await assayToId('GxHiv1Vl')
  // Fix those results categorized as "Detected" Only but without the copies and the correspondent category 'MoreThan1000','LessThan1000','LessThan40'
  if (assayId) {
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
      .andWhere(knex.raw("resultData ->>'$.resultText'"), 'LIKE', 'HIV-1 DETECTED %copies%')

    // Fix all results with the resultText property null values assigned and the resultCategory 'Success'.
    // It updates to No Result
    await knex('Result')
      .update('resultCategory1', resultCategoryNoResult)
      .whereRaw("resultData ->>'$.resultText' is null")
      .andWhere({ assayId })
      .andWhere('resultCategory1', resultCategorySuccess)
      .orWhere(knex.raw("resultData ->>'$.resultText'"), 'null')

    // Fill all results with the resultText property with 'HIV-1 NOT DETECTED' and the result Category 'Success'
    await knex('Result')
      .update('resultCategory1', resultCategoryNotDetected)
      .andWhere('resultCategory1', resultCategorySuccess)
      .andWhere(knex.raw("resultData ->>'$.resultText'"), 'LIKE', 'HIV-1 NOT DETECTED')

    await upsertAssayResultCategories(knex, assayId, ['LessThan40'])
  }
}

module.exports = {
  fixActualGeneXpertHivVlData,
}
