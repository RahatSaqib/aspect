import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { DEVICE_KEY, DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT } from './deviceKeys'

const getMaintenanceStatus = async onlyManuallySetableStatuses =>
  fetchWrapperForQueries({
    endpoint: DEVICE_RESULT_CATEGORY_GROUP_ENDPOINT,
    params: { onlyManuallySet: onlyManuallySetableStatuses },
  }).then(response => response.data)

const useDeviceMaintenanceStatus = onlyManuallySetableStatuses =>
  useQuery([DEVICE_KEY, onlyManuallySetableStatuses], () => getMaintenanceStatus(onlyManuallySetableStatuses), {
    ...SELECTS_QUERY_OPTIONS,
  })

export default useDeviceMaintenanceStatus
