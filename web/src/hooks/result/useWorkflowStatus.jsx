import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { RESULT_KEY, RESULT_KEY_RESULT_WORKFLOW_STATUS_ENDPOINT } from './resultKeys.js'

const getWorkflowStatus = async () =>
  fetchWrapperForQueries({ endpoint: RESULT_KEY_RESULT_WORKFLOW_STATUS_ENDPOINT }).then(response => response.data)

const useWorkflowStatus = () =>
  useQuery([RESULT_KEY, 'status'], () => getWorkflowStatus(), { ...SELECTS_QUERY_OPTIONS })

export default useWorkflowStatus
