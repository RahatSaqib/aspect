import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_DEPLOYMENTS_KEY, DEVICE_DEPLOYMENTS_ENDPOINT } from './deviceKeys'

const getDeployments = async deviceId =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(DEVICE_DEPLOYMENTS_ENDPOINT, { deviceId }) }).then(
    response => response.data
  )

const useDeployments = deviceId =>
  useQuery([DEVICE_DEPLOYMENTS_KEY, deviceId], () => getDeployments(deviceId), { enabled: !!deviceId })

export default useDeployments
