import isNil from 'lodash/isNil'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY } from '../device/deviceKeys'
import { DEVICE_WORKLOAD_KEY_BY_ASSAY_ID_ENDPOINT } from './workloadKeys'

const getDeviceWorkload = async originalParams => {
  const params = { ...originalParams }
  delete params.singleAssayId
  params.assayId = originalParams.singleAssayId

  return fetchWrapperForQueries({ endpoint: DEVICE_WORKLOAD_KEY_BY_ASSAY_ID_ENDPOINT, params }).then(response => ({
    data: response.data,
    total: response.total,
    extraColumns: response.extraColumns,
  }))
}

const useWorkload = params =>
  useQuery([DEVICE_KEY, params], () => getDeviceWorkload(params), {
    enabled: !!(params && params.singleAssayId !== -1 && !isNil(params.singleAssayId)),
  })

export default useWorkload
