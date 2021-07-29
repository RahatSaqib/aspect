import resultCategoryTypeMessages from '../shared/messages/resultCategoryType'
import resultCategoryMessages from '../shared/messages/resultCategory'

export default function collectionOfResultsToString(result, formatMessage) {
  let collectionOfResults = ''
  Object.keys(result.collectionOfResults).forEach(categoryType => {
    const { categoryTypeI18nKey, resultCategoryI18nKey } =
      result.collectionOfResults[categoryType]
    const translatedCategoryType = categoryTypeI18nKey
      ? formatMessage(resultCategoryTypeMessages[categoryTypeI18nKey])
      : categoryType
    const categoryResultI18nKey = resultCategoryI18nKey
    collectionOfResults += `${translatedCategoryType}: ${formatMessage(
      resultCategoryMessages[categoryResultI18nKey]
    )} \n`
  })
  return collectionOfResults
}
