import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY, DEVICE_WORKLOAD_KEY_BY_ASSAY_ID_ENDPOINT } from './deviceKeys'

const getDeviceWorkload = async params =>
  fetchWrapperForQueries({ endpoint: DEVICE_WORKLOAD_KEY_BY_ASSAY_ID_ENDPOINT, params }).then(response => ({
    data: response.data,
    total: response.total,
    extraColumns: response.extraColumns,
  }))

const useWorkload = params => useQuery([DEVICE_KEY, params], () => getDeviceWorkload(params), { enabled: !!params })

export default useWorkload
