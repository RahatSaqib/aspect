import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY, DEVICE_TYPE_KEY_LIST_ENDPOINT } from './deviceKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: DEVICE_TYPE_KEY_LIST_ENDPOINT }).then(response => response.data)

const useDeviceTypeList = () => useQuery([DEVICE_KEY, 'type', 'list'], () => getDeviceSelectList())

export default useDeviceTypeList
