import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_API_KEY_KEY, DEVICE_KEY_GENERATE_ENDPOINT } from './deviceApiKeyKeys.js'

const generateApiKey = async data => {
  return fetchWrapperForQueries({
    endpoint: DEVICE_KEY_GENERATE_ENDPOINT,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const useDeviceApiKeyGenerate = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => generateApiKey(data), {
    onSuccess: () => {
      queryClient.invalidateQueries([DEVICE_API_KEY_KEY])
    },
  })

  return mutation
}

export default useDeviceApiKeyGenerate
