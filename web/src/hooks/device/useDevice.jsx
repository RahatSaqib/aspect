import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_KEY_BY_ID_ENDPOINT } from './deviceKeys'

const getDeviceById = async deviceId =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(DEVICE_KEY_BY_ID_ENDPOINT, { deviceId }) }).then(
    response => response.data
  )

const useDevice = deviceId => useQuery([DEVICE_KEY, deviceId], () => getDeviceById(deviceId))

export default useDevice
