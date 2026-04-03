import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_KEY_BY_ID_ENDPOINT } from './deviceKeys'

const updateDeviceById = async (device, deviceId) => {
  const implementingPartnerId = device?.implementingPartnerId
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_KEY_BY_ID_ENDPOINT, { deviceId }),
    method: 'PUT',
    params: {
      name: device.name,
      shortName: device.shortName,
      stickerInstrumentSerial: device.stickerInstrumentSerial || null,
      instrumentModel: device.instrumentModel ?? null,
      softwareType: device.softwareType ?? null,
      isDaisyChained: device.isDaisyChained,
      dailyTestCapacity: device.dailyTestCapacity,
      moduleBayCapacity: device.moduleBayCapacity,
      notes: device.notes,
      siteId: device.siteId,
      configurationData: device.configurationData,
      gx6cModulesCount: device?.gx6cModulesCount,
      gx10cModulesCount: device?.gx10cModulesCount,
      implementingPartnerId: implementingPartnerId ? Number(implementingPartnerId) : null,
      approvalToken: device.approvalToken,
    },
  })
}

const useUpdateDevice = deviceId => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => updateDeviceById(data, deviceId), {
    onSuccess: () => queryClient.invalidateQueries([DEVICE_KEY, String(deviceId)]),
  })

  return mutation
}

export default useUpdateDevice
