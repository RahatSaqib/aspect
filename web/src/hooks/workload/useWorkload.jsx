import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY } from '../device/deviceKeys'
import { DEVICE_WORKLOAD_KEY_BY_ASSAY_ID_ENDPOINT } from './workloadKeys'

const getDeviceWorkload = async originalParams => {
  const params = { ...originalParams }
  delete params.singleAssayId
  params.assayId = originalParams.singleAssayId

  return fetchWrapperForQueries({
    endpoint: DEVICE_WORKLOAD_KEY_BY_ASSAY_ID_ENDPOINT,
    params: omitBy(params, isNil),
  }).then(response => ({
    data: response.data,
    total: response.total,
    extraColumns: response.extraColumns,
  }))
}

const useWorkload = params => useQuery([DEVICE_KEY, params], () => getDeviceWorkload(params))

export default useWorkload
