import { useMutation, useQueryClient } from 'react-query'
import { aspectFetch } from '../../utils/utils/fetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_DEPLOYMENTS_KEY, DEVICE_DEPLOYMENTS_PERSIST_ENDPOINT } from './deviceKeys'

const persistChanges = async ({ deviceId, changes }) => {
  const endpoint = replaceRouteParams(DEVICE_DEPLOYMENTS_PERSIST_ENDPOINT, { deviceId })
  return aspectFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ changes }),
  })
}

const usePersistDeployments = () => {
  const queryClient = useQueryClient()

  return useMutation(persistChanges, {
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries([DEVICE_DEPLOYMENTS_KEY, deviceId])
      queryClient.invalidateQueries([DEVICE_KEY, deviceId])
    },
  })
}

export default usePersistDeployments
