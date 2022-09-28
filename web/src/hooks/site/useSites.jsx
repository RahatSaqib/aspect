import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SITE_KEY, SITE_KEY_SITE_ENDPOINT } from './siteKeys.js'

const getSites = async ({ sortCol, sortDir, pageAt, pageSize, filters }) =>
  fetchWrapperForQueries({
    endpoint: SITE_KEY_SITE_ENDPOINT,
    params: {
      sortCol,
      sortDir,
      page: pageAt,
      size: pageSize,
      ...filters,
    },
  }).then(response => {
    return { siteList: response.data, total: response.total }
  })

const useSites = ({ sortCol, sortDir, pageAt, pageSize, filters }, options) => {
  const params = { sortCol, sortDir, pageAt, pageSize, filters }
  return useQuery([SITE_KEY, params], () => getSites(params), options)
}

export default useSites
