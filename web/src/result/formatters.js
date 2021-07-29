import resultCategoryTypeMessages from '../shared/messages/resultCategoryType'
import resultCategoryMessages from '../shared/messages/resultCategory'

/**
 * Formats the collection of results from a GeneXpert's result object into a string value
 * @param {*} result A plan JS object of a result
 * @param {function} formatMessage The i18n formatMessage function
 * @returns A string containing the key value pairs separated by new lines. Ex.: "MTB: Detected\nRIF Resistance: Detected\n"
 */
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
