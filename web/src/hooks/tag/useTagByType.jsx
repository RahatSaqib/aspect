import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { TAG_KEY, TAG_KEY_BY_TYPE_ENDPOINT } from './tagKeys.js'

const getTagsByType = async type =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(TAG_KEY_BY_TYPE_ENDPOINT, { type }),
  }).then(response => response.data)

const useTagByType = type => useQuery([TAG_KEY, type], () => getTagsByType(type), { ...SELECTS_QUERY_OPTIONS })

export default useTagByType
