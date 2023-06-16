import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { replaceRouteParams } from '../../../components/QueryFetch/Helpers'
import { DEVICE_ERRORS_ENDPOINT, DEVICE_ERRORS_KEY } from './keys'

const getDeviceErrors = async params =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_ERRORS_ENDPOINT),
    params: {
      size: 9999,
      ...params,
    },
  }).then(response => response.data)

const useDeviceErrors = params => {
  return useQuery([DEVICE_ERRORS_KEY, params], () => getDeviceErrors(params))
}

export default useDeviceErrors
