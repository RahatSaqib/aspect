import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { RESULT_KEY, RESULT_KEY_XDR_SUMMARY_ENDPOINT } from './resultKeys.js'

const getSummary = async params =>
  fetchWrapperForQueries({ endpoint: RESULT_KEY_XDR_SUMMARY_ENDPOINT, params }).then(response => response)

const useXdrStatus = params => useQuery([RESULT_KEY, 'summary', params], () => getSummary(params))

export default useXdrStatus
