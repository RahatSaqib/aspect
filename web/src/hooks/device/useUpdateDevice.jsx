import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_KEY_BY_ID_ENDPOINT } from './deviceKeys'

const updateDeviceById = async (device, deviceId) => {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_KEY_BY_ID_ENDPOINT, { deviceId }),
    method: 'PUT',
    params: {
      name: device.name,
      shortName: device.shortName,
      deviceCapacityId: device.dailyCapacityId,
      notes: device.notes,
      siteId: device.siteId,
      configurationData: device.configurationData,
      approvalToken: device.approvalToken,
    },
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
