import { aspectFetch } from '../../shared/utils/fetch'
import { mergeErrors } from './errors'

const fetchWrapperForQueries = ({
  endpoint,
  method = 'GET',
  params = {},
  customErrorNotifications = {},
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
      endpoint += `?${Object.keys(params)
        .map(k => `${k}=${encodeURIComponent(params[k])}`)
        .join('&')}`
      break
    default:
      throw new Error(
        `Method ${method} is not supported by fetchWrapperForQueries function`
      )
  }

  const errorNotifications = mergeErrors(endpoint, customErrorNotifications)

  return aspectFetch(endpoint, {
    method,
    errorNotifications,
    body,
  })
    .then(data => data)
    .catch(err => err)
}

export default fetchWrapperForQueries
