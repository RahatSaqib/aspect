import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_TYPE_KEY, DEVICE_TYPE_KEY_LIST_ENDPOINT } from './deviceTypeKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: DEVICE_TYPE_KEY_LIST_ENDPOINT }).then(response => response.data)

const useDeviceTypeList = () => useQuery([DEVICE_TYPE_KEY, 'list'], () => getDeviceSelectList())

export default useDeviceTypeList
