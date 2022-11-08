import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_CAPACITY_KEY_ENDPOINT } from './deviceKeys.js'

const getDeviceSelectList = async deviceTypeId => {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_CAPACITY_KEY_ENDPOINT, { deviceTypeId }),
  }).then(response => response.data)
}

const useDeviceCapacityForSelect = deviceTypeId =>
  useQuery([DEVICE_KEY, 'capacity', deviceTypeId], () => getDeviceSelectList(deviceTypeId))

export default useDeviceCapacityForSelect
