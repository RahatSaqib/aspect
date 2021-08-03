import Immutable from 'immutable'
import resultCategoryTypeMessages from '../shared/messages/resultCategoryType'
import resultCategoryMessages from '../shared/messages/resultCategory'

const getFormatterFactory = formatMessage => key => {
  const formatters = {
    collectionOfResultsToString: collectionOfResults => {
      let formattedCollectionOfResults = ''

      if (Immutable.isMap(collectionOfResults))
        collectionOfResults = collectionOfResults.toJS()

      Object.keys(collectionOfResults).forEach(categoryType => {
        const { categoryTypeI18nKey, resultCategoryI18nKey } =
          collectionOfResults[categoryType]
        const translatedCategoryType = categoryTypeI18nKey
          ? formatMessage(resultCategoryTypeMessages[categoryTypeI18nKey])
          : categoryType
        const categoryResultI18nKey = resultCategoryI18nKey
        formattedCollectionOfResults += `${translatedCategoryType}: ${formatMessage(
          resultCategoryMessages[categoryResultI18nKey]
        )} \n`
      })
      return formattedCollectionOfResults
    },
  }

  return formatters[key]
}

export default getFormatterFactory
