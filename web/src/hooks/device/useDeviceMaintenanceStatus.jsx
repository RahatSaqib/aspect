import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
// import { DEVICE_STATUS } from '../../components/QueryFetch/Device/index'
import { DEVICE_KEY, DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT } from './deviceKeys'

const getMaintenanceStatus = async onlyManuallySetableStatuses =>
  fetchWrapperForQueries({
    endpoint: DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT,
    params: { onlyManuallySet: onlyManuallySetableStatuses },
  }).then(response => response.data)

const useDeviceMaintenanceStatus = onlyManuallySetableStatuses =>
  useQuery([DEVICE_KEY, onlyManuallySetableStatuses], () => getMaintenanceStatus(onlyManuallySetableStatuses))

export default useDeviceMaintenanceStatus
