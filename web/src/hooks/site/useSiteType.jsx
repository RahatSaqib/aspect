import { useQuery } from 'react-query'
import { SITE_KEY, SITE_KEY_SITE_TYPE_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

const getSiteType = async () =>
  fetchWrapperForQueries({ endpoint: SITE_KEY_SITE_TYPE_ENDPOINT }).then(response => response.data)

const useSiteType = () => useQuery([SITE_KEY, 'type'], () => getSiteType())

export default useSiteType
