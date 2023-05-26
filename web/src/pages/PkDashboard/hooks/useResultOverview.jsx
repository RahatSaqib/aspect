import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../components/QueryFetch/index.js'
import { RESULT_KEY, RESULT_OVERVIEW_ENDPOINT } from './keys.js'

const getResultOverview = async () =>
  fetchWrapperForQueries({ endpoint: RESULT_OVERVIEW_ENDPOINT }).then(response => response.data)

const useResultOverview = () => useQuery([RESULT_KEY, 'overview'], getResultOverview)

export default useResultOverview
