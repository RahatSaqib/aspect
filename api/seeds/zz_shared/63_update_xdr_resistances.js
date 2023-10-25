const Promise = require('bluebird')
const {
  getDetectedResistanceCategoryTypes,
} = require('../../src/plugin/deviceType/GxConnect/resultCategories/resultCategoriesMapping')

module.exports = require('../utils').seed(async knex => {
  const { id: xdrAssayId } = await knex('Assay').where('externalId', 'GxMtbXdr').first('id')

  /**
   * get all MTB-XDR results
   */
  const results = await knex('Result')
    .where('assayId', xdrAssayId)
    .whereNotNull('resultData')
    .select('id', 'resultData')
  await Promise.each(results, async result => {
    let resultData
    try {
      resultData = JSON.parse(result.resultData)
    } catch {
      return
    }
    const { resultText } = resultData
    if (!resultText) return
    /**
     * for getting `detectedResistance` and `allResistances` do the same as in
     * func `preProcessMergeResult(...)` in file `api/src/plugin/deviceType/gxUtils.js`
     */
    const { detectedResistance, allResistances } = getDetectedResistanceCategoryTypes(resultText)
    resultData = { ...resultData, detectedResistance, allResistances }

    await knex('Result')
      .update({
        resultData: JSON.stringify(resultData),
      })
      .where('id', result.id)
  })
}, __filename)
