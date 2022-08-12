import { useQuery } from 'react-query'
import { TAG_KEY, TAG_KEY_BY_TYPE_AND_ID_ENDPOINT } from './tagKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'

const getContactsBySiteId = async (type, id) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(TAG_KEY_BY_TYPE_AND_ID_ENDPOINT, { type, id }),
  }).then(response => response.data)

const useTagByTypeAndId = (type, id) => useQuery([TAG_KEY, type, id], () => getContactsBySiteId(type, id))

export default useTagByTypeAndId
