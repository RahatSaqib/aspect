import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_PERFORMANCE_KEY_BY_ID_ENDPOINT } from './deviceKeys'

const getDevicePerformanceById = async (deviceId, params) => {
  const offset = new Date().getTimezoneOffset()
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_PERFORMANCE_KEY_BY_ID_ENDPOINT, { deviceId, offset }),
    params,
  }).then(response => response)
}

const useDevicePerformance = (deviceId, params) =>
  useQuery([DEVICE_KEY, 'performance', deviceId], () => getDevicePerformanceById(deviceId, params))

export default useDevicePerformance
