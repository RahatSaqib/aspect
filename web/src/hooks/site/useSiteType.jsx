import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SITE_KEY, SITE_KEY_SITE_TYPE_ENDPOINT } from './siteKeys.js'

const getSiteType = async () =>
  fetchWrapperForQueries({ endpoint: SITE_KEY_SITE_TYPE_ENDPOINT }).then(response => response.data)

const useSiteType = () => useQuery([SITE_KEY, 'type'], () => getSiteType())

export default useSiteType
