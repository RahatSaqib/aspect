import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_KEY_BY_ID_ENDPOINT } from './deviceKeys'

const toNullableNumber = value => {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : value
}

const updateDeviceById = async (device, deviceId) => {
  const implementingPartnerId = device?.implementingPartnerId
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_KEY_BY_ID_ENDPOINT, { deviceId }),
    method: 'PUT',
    params: {
      name: device.name,
      shortName: device.shortName,
      customNamePart: device.customNamePart,
      stickerInstrumentSerial: device.stickerInstrumentSerial || null,
      instrumentModel: device.instrumentModel ?? null,
      softwareType: device.softwareType ?? null,
      isDaisyChained: device.isDaisyChained,
      dailyTestCapacity: toNullableNumber(device.dailyTestCapacity),
      moduleBayCapacity: toNullableNumber(device.moduleBayCapacity),
      notes: device.notes,
      siteId: device.siteId ?? null,
      configurationData: device.configurationData,
      gx6cModulesCount: toNullableNumber(device.gx6cModulesCount),
      gx10cModulesCount: toNullableNumber(device.gx10cModulesCount),
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
