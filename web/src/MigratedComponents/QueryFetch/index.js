import _ from 'lodash'
import { aspectFetch } from '../../shared/utils/fetch'
import defaultErrors from './errors'

const buildEndpointAndQueryString = (endpoint, params) => {
  if (Object.keys(params).length !== 0 && params.constructor === Object) {
    return `${endpoint}?${new URLSearchParams(params).toString()}`
  }
  if (_.isArray(params)) {
    return `${endpoint}?${_.map(
      params,
      v => `${_.keys(v)[0]}=${_.values(v)[0]}`
    ).join('&')}`
  }
  return endpoint
}

const buildBodyParams = (endpoint, params) => {
  switch (endpoint) {
    case '/result/confirmed-treatment-tracking':
      return JSON.stringify({})

    default:
      return JSON.stringify(params)
  }
}

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
      body = buildBodyParams(endpoint, params)
      break
    case 'DELETE':
    case 'GET':
      endpoint = buildEndpointAndQueryString(endpoint, params)
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
