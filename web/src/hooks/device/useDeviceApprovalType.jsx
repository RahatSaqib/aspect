import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY, DEVICE_APPROVAL_TYPE_ENDPOINT } from './deviceKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: DEVICE_APPROVAL_TYPE_ENDPOINT }).then(response => response.data)

const useDeviceApprovalType = () => useQuery([DEVICE_KEY, 'approval-type', 'list'], () => getDeviceSelectList())

export default useDeviceApprovalType
