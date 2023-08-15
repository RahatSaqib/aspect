import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { assay, resultCategory } from '../../messages'
import useI18n from '../useI18n'
import { RESULT_KEY, RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT } from './resultKeys.js'

const getResultCategoryGroup = async assayId =>
  fetchWrapperForQueries({
    endpoint: RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT,
    params: assayId?.map(id => ({ assayId: id })),
  }).then(response => response.data)

const useResultCategoryGroup = (assayIds, options) => {
  const { formatMessage } = useI18n()
  const assayIdsLength = assayIds?.length

  return useQuery([RESULT_KEY, 'category-group', assayIds], () => getResultCategoryGroup(assayIds), {
    ...options,
    enabled: !!assayIdsLength,
    select: data =>
      data?.map(category => ({
        ...category,
        name: `${assayIdsLength > 1 ? `${formatMessage(assay[category?.assayI18nKey])} - ` : ''}${formatMessage(
          resultCategory[category?.i18nKey]
        )}`,
      })),
  })
}
export default useResultCategoryGroup
