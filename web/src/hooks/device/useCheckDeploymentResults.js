import { useMutation } from 'react-query'
import { aspectFetch } from '../../utils/utils/fetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_DEPLOYMENTS_CHECK_RESULTS_ENDPOINT } from './deviceKeys'

const checkResults = async ({ deviceId, deployments }) => {
  const endpoint = replaceRouteParams(DEVICE_DEPLOYMENTS_CHECK_RESULTS_ENDPOINT, { deviceId })
  const response = await aspectFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ deployments }),
  })
  return response.data
}

const useCheckDeploymentResults = () => useMutation(checkResults)

export default useCheckDeploymentResults
