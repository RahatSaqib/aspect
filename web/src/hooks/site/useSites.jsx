import { useQuery } from 'react-query'
import { SITE_KEY, SITE_KEY_SITE_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

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

const useSites = ({ sortCol, sortDir, pageAt, pageSize, filters }, options) =>
  useQuery([SITE_KEY, 'table'], () => getSites({ sortCol, sortDir, pageAt, pageSize, filters }), options)

export default useSites
