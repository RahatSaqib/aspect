import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { DEVICE_KEY, DEVICE_APPROVAL_TYPE_ENDPOINT } from './deviceKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: DEVICE_APPROVAL_TYPE_ENDPOINT }).then(response => response.data)

const useDeviceApprovalType = () =>
  useQuery([DEVICE_KEY, 'approval-type', 'list'], () => getDeviceSelectList(), { ...SELECTS_QUERY_OPTIONS })

export default useDeviceApprovalType
