import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SITE_KEY, SITE_KEY_SITE_LIST_ENDPOINT } from './siteKeys.js'

const getSiteList = async () =>
  fetchWrapperForQueries({ endpoint: SITE_KEY_SITE_LIST_ENDPOINT }).then(response => response.data)

const useSiteList = () => useQuery([SITE_KEY, 'list'], () => getSiteList())

export default useSiteList
