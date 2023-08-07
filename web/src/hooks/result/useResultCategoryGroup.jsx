import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { assay, resultCategory } from '../../messages'
import useI18n from '../useI18n'
import { RESULT_KEY, RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT } from './resultKeys.js'
import isArray from 'lodash/isArray'

const getResultCategoryGroup = async assayId =>
  fetchWrapperForQueries({
    endpoint: RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT,
    params: assayId?.map(i => ({ assayId: i })),
  }).then(response => response.data)

const useResultCategoryGroup = (assayIds, options) => {
  const { formatMessage } = useI18n()

  return useQuery([RESULT_KEY, 'category-group', assayIds], () => getResultCategoryGroup(assayIds), {
    ...options,
    select: data =>
      data?.map(i => ({
        ...i,
        name: `${assayIds?.length > 1 ? `${formatMessage(assay[i?.assayI18nKey])} - ` : ''}${formatMessage(
          resultCategory[i?.i18nKey]
        )}`,
      })),
  })
}
export default useResultCategoryGroup
