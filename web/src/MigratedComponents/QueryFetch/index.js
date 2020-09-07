import { aspectFetch } from '../../shared/utils/fetch'
import defaultErrors from './errors'

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
      endpoint =
        Object.keys(params).length !== 0 && params.constructor === Object
          ? `${endpoint}?${new URLSearchParams(params).toString()}`
          : endpoint
      break
    default:
      throw new Error(
        `Method ${method} is not supported by fetchWrapperForQueries function`
      )
  }

  return aspectFetch(endpoint, {
    method,
    errors: {
      ...defaultErrors(endpoint),
      ...customErrorNotifications,
    },
    body,
  })
    .then(data => data)
    .catch(err => err)
}

export default fetchWrapperForQueries
