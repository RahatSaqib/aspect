import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_KEY_BY_ID_ENDPOINT } from './deviceKeys'

const updateDeviceById = async (device, deviceId) => {
  const submitDevice = { siteId: device.siteId }

  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_KEY_BY_ID_ENDPOINT, { deviceId }),
    method: 'PUT',
    params: { ...submitDevice },
  })
}

const useUpdateDevice = deviceId => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => updateDeviceById(data, deviceId), {
    onSuccess: () => queryClient.invalidateQueries([DEVICE_KEY, deviceId]),
  })

  return mutation
}

export default useUpdateDevice
