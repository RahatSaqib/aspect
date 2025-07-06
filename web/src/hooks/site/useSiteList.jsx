import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SITE_KEY, SITE_KEY_SITE_SELECT_LIST_ENDPOINT } from './siteKeys.js'

const getSiteList = async params => {
  const response = await fetchWrapperForQueries({ endpoint: SITE_KEY_SITE_SELECT_LIST_ENDPOINT, params })
  console.log('getSiteList - full response:', response)
  console.log('getSiteList - response.data:', response.data)
  return response.data
}

const useSiteList = queryParams => {
  const query = useQuery(
    [SITE_KEY, 'list', queryParams],
    () => getSiteList(queryParams),
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 0
    }
  )

  // Debug logging
  console.log('useSiteList - query:', query)

  return query
}

export default useSiteList
