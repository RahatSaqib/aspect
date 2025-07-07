import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SITE_KEY, SITE_KEY_SITE_SELECT_LIST_ENDPOINT } from './siteKeys.js'

const getSiteList = async params => {
  const response = await fetchWrapperForQueries({ endpoint: SITE_KEY_SITE_SELECT_LIST_ENDPOINT, params })
  return response.data
}

const useSiteList = queryParams => {
  const query = useQuery([SITE_KEY, 'list', queryParams], () => getSiteList(queryParams), {
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
  })

  return query
}

export default useSiteList
