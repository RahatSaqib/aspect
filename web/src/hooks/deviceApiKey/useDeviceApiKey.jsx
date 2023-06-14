import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_API_KEY_KEY, DEVICE_KEY_BY_ID_ENDPOINT } from './deviceApiKeyKeys'

const getDeviceApiKey = async params =>
  fetchWrapperForQueries({ endpoint: DEVICE_KEY_BY_ID_ENDPOINT, params }).then(response => ({
    data: response.data,
    total: response.total,
  }))

const useDeviceApiKey = (params, options) =>
  useQuery([DEVICE_API_KEY_KEY, params], () => getDeviceApiKey(params), options)

export default useDeviceApiKey
