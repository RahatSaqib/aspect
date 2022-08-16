import { useQuery } from 'react-query'
import { JOB_FUNCTIONS_KEY, JOB_FUNCTIONS_KEY_ENDPOINT } from './jobFunctionsKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

const getSiteById = async () =>
  fetchWrapperForQueries({ endpoint: JOB_FUNCTIONS_KEY_ENDPOINT }).then(response => response.data[0].jobFunctions)

const useJobFunctions = () => useQuery([JOB_FUNCTIONS_KEY], () => getSiteById())

export default useJobFunctions
