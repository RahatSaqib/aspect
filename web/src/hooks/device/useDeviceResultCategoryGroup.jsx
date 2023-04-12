import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY, DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT } from './deviceKeys.js'

const getResultCategoryGroup = async () => {
  return fetchWrapperForQueries({ endpoint: DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT }).then(response => response.data)
}

const useResultCategoryGroup = () => useQuery([DEVICE_KEY, 'categoryGroup'], () => getResultCategoryGroup())

export default useResultCategoryGroup
