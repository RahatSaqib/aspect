import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { replaceRouteParams } from '../../../components/QueryFetch/Helpers'
import { DEVICE_ERRORS_GRAPH_KEY, DEVICE_ERRORS_GRAPH_ENDPOINT } from './keys'

const getDeviceErrors = async params =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_ERRORS_GRAPH_ENDPOINT),
    params,
  }).then(response => response.data)

const useDeviceErrorGraph = (params, options) => {
  return useQuery([DEVICE_ERRORS_GRAPH_KEY, params], () => getDeviceErrors(params), options)
}

export default useDeviceErrorGraph
