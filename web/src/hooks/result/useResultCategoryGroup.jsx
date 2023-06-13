import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { RESULT_KEY, RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT } from './resultKeys.js'

const getResultCategoryGroup = async assayId =>
  fetchWrapperForQueries({ endpoint: RESULT_KEY_RESULT_CATEGORY_GROUP_ENDPOINT, params: { assayId } }).then(
    response => response.data
  )

const useResultCategoryGroup = assayId =>
  useQuery([RESULT_KEY, 'category-group'], () => getResultCategoryGroup(assayId))

export default useResultCategoryGroup
