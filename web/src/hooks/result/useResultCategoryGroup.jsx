import isArray from 'lodash/isArray'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { assay, resultCategory } from '../../messages'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { RESULT_KEY, RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT } from './resultKeys.js'

const getResultCategoryGroup = async assayId =>
  fetchWrapperForQueries({
    endpoint: RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT,
    params: isArray(assayId) ? assayId.map(id => ({ assayId: id })) : [{ assayId }],
  }).then(response => response.data)

const useResultCategoryGroup = (assayIds, options) => {
  const { formatMessage } = useIntl()
  const assayIdsLength = assayIds?.length

  return useQuery([RESULT_KEY, 'category-group', assayIds], () => getResultCategoryGroup(assayIds), {
    ...options,
    ...SELECTS_QUERY_OPTIONS,
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
