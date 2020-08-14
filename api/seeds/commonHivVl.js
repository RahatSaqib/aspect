async function fixActualHivVlData(knex) {
    const {
        LessThan1000: resultCategoryLessThan1000,
        MoreThan1000: resultCategoryMoreThan1000,
        LessThan40: resultCategoryLessThan40
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
        )`
            )
        )
        .where({ assayId })
        .andWhere(
            knex.raw("resultData ->>'$.resultText'"),
            'LIKE',
            'HIV-1 DETECTED %copies%'
        )

    await upsertAssayResultCategories(knex, assayId, ['LessThan40', 'Detected'])
}

module.exports = {
    fixActualHivVlData
}