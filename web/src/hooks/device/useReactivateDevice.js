import { useMutation, useQueryClient } from 'react-query'
import { DEVICE_LIST } from '../../components/QueryFetch/Device'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { aspectFetch } from '../../utils/utils/fetch'
import {
  DEVICE_DEPLOYMENTS_KEY,
  DEVICE_KEY,
  DEVICE_KEY_DEVICE_LIST_ENDPOINT,
  DEVICE_REACTIVATE_ENDPOINT,
} from './deviceKeys'

const reactivateDevice = async ({ deviceId, siteId }) => {
  const endpoint = replaceRouteParams(DEVICE_REACTIVATE_ENDPOINT, { deviceId })
  return aspectFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ siteId }),
  })
}

const useReactivateDevice = () => {
  const queryClient = useQueryClient()

  return useMutation(reactivateDevice, {
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries([DEVICE_LIST.KEY])
      queryClient.invalidateQueries([DEVICE_KEY_DEVICE_LIST_ENDPOINT])
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === DEVICE_KEY && String(query.queryKey[1]) === String(deviceId),
      })
      queryClient.invalidateQueries({
        predicate: query =>
          query.queryKey[0] === DEVICE_DEPLOYMENTS_KEY && String(query.queryKey[1]) === String(deviceId),
      })
    },
  })
}

export default useReactivateDevice
