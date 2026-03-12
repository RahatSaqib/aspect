import { useMutation, useQueryClient } from 'react-query'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { aspectFetch } from '../../utils/utils/fetch'
import {
  CANDIDATE_INSTRUMENTS_KEY,
  DEVICE_DEPLOYMENTS_KEY,
  DEVICE_DEPLOYMENTS_PERSIST_ENDPOINT,
  DEVICE_INSTRUMENTS_KEY,
  DEVICE_KEY,
} from './deviceKeys'

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
      // Invalidate device query so the profile site and approval refresh even when
      // one caller uses a numeric id and another uses a string id.
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === DEVICE_KEY && String(query.queryKey[1]) === String(deviceId),
      })
      // Refresh device instruments section (instruments may be tied to deployments)
      queryClient.invalidateQueries([DEVICE_INSTRUMENTS_KEY, deviceId])
      queryClient.invalidateQueries([CANDIDATE_INSTRUMENTS_KEY, deviceId])
    },
  })
}

export default usePersistDeployments
