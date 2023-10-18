const Promise = require('bluebird')
const { getResultCategories } = require('../../src/plugin/deviceType/gxUtils')
const {
  getDetectedResistanceCategoryTypes,
} = require('../../src/plugin/deviceType/GxConnect/resultCategories/resultCategoriesMapping')
const { allResultCategoryToId } = require('../../src/shared/dictionary')

const xdrExtId = 'GxMtbXdr'
const uknwExtId = 'GxUnknown'

exports.seed = async function (knex) {
  const rcMapping = await allResultCategoryToId()
  const newAssayId = (await knex('Assay').select('id').where('externalId', xdrExtId))[0].id

  const ids = await knex('Result')
    .select('id')
    .where('assayId', knex('Assay').select('id').where('externalId', uknwExtId))
    .andWhere('resultData', 'like', '%INH%')

  await Promise.each(ids, async item => {
    const resData = JSON.parse((await knex('Result').select('resultData').where('id', item.id))[0].resultData)

    const result = getResultCategories({
      data: resData,
      assay: {
        id: xdrExtId,
      },
    })

    const rc1 = result && result[0] ? result[0].id : null
    const rc2 = result && result[1] ? result[1].id : null

    if (rc2) {
      const { detectedResistance, allResistances } = getDetectedResistanceCategoryTypes(resData.resultText)
      resData.detectedResistance = detectedResistance
      resData.allResistances = allResistances
    } else resData.detectedResistance = null

    await knex('Result')
      .update({
        assayId: newAssayId,
        resultCategory1: rcMapping[rc1],
        resultCategory2: rcMapping[rc2],
        resultData: JSON.stringify(resData),
      })
      .where('id', item.id)
  })
}
