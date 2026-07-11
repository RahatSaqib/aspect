import { useMutation, useQueryClient } from 'react-query'
import { DEVICE_LIST } from '../../components/QueryFetch/Device'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_DECOMMISSION_ENDPOINT, DEVICE_KEY, DEVICE_KEY_DEVICE_LIST_ENDPOINT } from './deviceKeys'

const decommissionDevice = async ({ deviceId }) => {
  const endpoint = replaceRouteParams(DEVICE_DECOMMISSION_ENDPOINT, { deviceId })
  return aspectFetch(endpoint, {
    method: 'POST',
  })
}

const useDecommissionDevice = () => {
  const queryClient = useQueryClient()

  return useMutation(decommissionDevice, {
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries([DEVICE_LIST.KEY])
      queryClient.invalidateQueries([DEVICE_KEY_DEVICE_LIST_ENDPOINT])
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === DEVICE_KEY && String(query.queryKey[1]) === String(deviceId),
      })
    },
  })
}

export default useDecommissionDevice
