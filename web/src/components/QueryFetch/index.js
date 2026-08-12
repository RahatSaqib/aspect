import { aspectFetch } from '../../utils/utils/fetch'
import defaultErrors from './errors'
import { buildEndpointAndQueryString } from './Helpers'

const fetchWrapperForQueries = ({
  endpoint,
  method = 'GET',
  params = {},
  customErrorNotifications = {},
  showErrorNotifications = true,
}) => {
  if (!endpoint) throw new Error(`You need to specify the 'endpoint' property`)
  let body = null

  switch (method) {
    case 'POST':
    case 'PUT':
    case 'PATCH':
      body = JSON.stringify(params)
      break
    case 'DELETE':
    case 'GET':
      endpoint = buildEndpointAndQueryString(endpoint, params)
      break
    default:
      throw new Error(`Method ${method} is not supported by fetchWrapperForQueries function`)
  }

  return aspectFetch(endpoint, {
    method,
    errorNotifications: showErrorNotifications ? { ...defaultErrors(endpoint), ...customErrorNotifications } : {},
    body,
  })
}

export default fetchWrapperForQueries
