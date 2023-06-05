import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { replaceRouteParams } from '../../../components/QueryFetch/Helpers'
import { DEVICE_ERRORS_KEY, DEVICE_ERRORS_ENDPOINT } from './keys'

const getDeviceErrors = async () =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_ERRORS_ENDPOINT),
    params: {
      size: 9999,
    },
  }).then(response => response.data)

const useDeviceErrors = () => useQuery([DEVICE_ERRORS_KEY], () => getDeviceErrors())

export default useDeviceErrors
