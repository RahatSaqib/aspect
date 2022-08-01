import { useQuery } from 'react-query'
import { SITE_KEY, SITE_KEY_BY_ID_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

const getSiteById = async siteId =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(SITE_KEY_BY_ID_ENDPOINT, { siteId }) }).then(
    response => response.data
  )

const useSite = siteId => useQuery([SITE_KEY, siteId], () => getSiteById(siteId))

export default useSite
