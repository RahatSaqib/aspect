import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'

const SAMPLE_KEY = 'SAMPLE'
const SAMPLE_ENDPOINT = '/sample'

const getSamples = async ({ sortCol, sortDir, pageAt, pageSize, filters }) =>
  fetchWrapperForQueries({
    endpoint: SAMPLE_ENDPOINT,
    params: {
      sortCol,
      sortDir,
      page: pageAt,
      size: pageSize,
      ...filters,
    },
  }).then(response => {
    return { sampleList: response.data, total: response.total }
  })

const useSamples = ({ sortCol, sortDir, pageAt, pageSize, filters }, options) => {
  const params = { sortCol, sortDir, pageAt, pageSize, filters }
  return useQuery([SAMPLE_KEY, params], () => getSamples(params), options)
}

export default useSamples
export { SAMPLE_KEY, SAMPLE_ENDPOINT }
