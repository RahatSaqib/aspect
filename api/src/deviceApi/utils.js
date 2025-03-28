const _ = require('lodash')
const { resultCategoryToId } = require('../shared/dictionary')

async function getResultCategoriesFromPayload(payload, existingResult = {}) {
  const categoryIds = _.map(payload.category, 'id')
  let resultCategory1 = null
  let resultCategory2 = null
  if (categoryIds.length > 0 && categoryIds[0]) {
    resultCategory1 = await resultCategoryToId(categoryIds[0])
  } else if (payload.error) {
    resultCategory1 = await resultCategoryToId('Error')
  } else if (existingResult && existingResult.resultCategory1) {
    ;({ resultCategory1 } = existingResult)
  } else {
    // TODO: Assign a resultCategoryId that represents 'unknown' or use null instead.
    // Setting 'Success' as the default for ResultCategory1 is not a good idea.
    resultCategory1 = await resultCategoryToId('Success')
  }
  if (categoryIds.length > 1 && categoryIds[1]) {
    resultCategory2 = await resultCategoryToId(categoryIds[1])
  }
  return { resultCategory1, resultCategory2 }
}

module.exports = {
  getResultCategoriesFromPayload,
}
