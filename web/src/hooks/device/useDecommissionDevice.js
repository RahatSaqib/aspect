import { useMutation, useQueryClient } from 'react-query'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_DECOMMISSION_ENDPOINT, DEVICE_KEY } from './deviceKeys'

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
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === DEVICE_KEY && String(query.queryKey[1]) === String(deviceId),
      })
    },
  })
}

export default useDecommissionDevice
