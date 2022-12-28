import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SITE_KEY, SITE_KEY_SITE_SELECT_LIST_ENDPOINT } from './siteKeys.js'

const getSiteList = async params =>
  fetchWrapperForQueries({ endpoint: SITE_KEY_SITE_SELECT_LIST_ENDPOINT, params }).then(response => response.data)

const useSiteList = queryParams => useQuery([SITE_KEY, 'list'], () => getSiteList(queryParams))

export default useSiteList
