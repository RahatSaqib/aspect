import { useQuery } from 'react-query'
import { SITE_KEY, SITE_KEY_SITE_SELECT_LIST_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

const getSiteList = async () =>
  fetchWrapperForQueries({ endpoint: SITE_KEY_SITE_SELECT_LIST_ENDPOINT }).then(response => response.data)

const useSiteList = () => useQuery([SITE_KEY, 'list'], () => getSiteList())

export default useSiteList
