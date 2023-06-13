import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { RESULT_KEY, RESULT_KEY_RESULT_WORKFLOW_STATUS_ENDPOINT } from './resultKeys.js'

const getWorkflowStatus = async () =>
  fetchWrapperForQueries({ endpoint: RESULT_KEY_RESULT_WORKFLOW_STATUS_ENDPOINT }).then(response => response.data)

const useWorkflowStatus = () => useQuery([RESULT_KEY, 'status'], () => getWorkflowStatus())

export default useWorkflowStatus
