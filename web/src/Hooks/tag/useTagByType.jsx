import { useQuery } from 'react-query'
import { TAG_KEY, TAG_KEY_BY_TYPE_ENDPOINT } from './tagKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

const getContactsBySiteId = async type =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(TAG_KEY_BY_TYPE_ENDPOINT, { type }),
  }).then(response => response.data)

const useTagByType = type => useQuery([TAG_KEY, type], () => getContactsBySiteId(type))

export default useTagByType
