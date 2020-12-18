import isArray from 'lodash/isArray'
import map from 'lodash/map'

import { aspectFetch } from '../../shared/utils/fetch'
import { getISOFromString } from '../Graphs/Helpers/Formatters/datetime'
import defaultErrors from './errors'

const checkIfParamIsDate = param => {
  const dateStringMatches = ['minDate', 'maxDate', 'currentMonth']
  const [key, value] = Object.entries(param)[0]
  return `${key}=${
    dateStringMatches.includes(key)
      ? encodeURIComponent(getISOFromString(value))
      : value
  }`
}

const buildEndpointAndQueryString = (endpoint, params) => {
  if (Object.keys(params).length !== 0 && params.constructor === Object) {
    return `${endpoint}?${new URLSearchParams(params).toString()}`
  }
  if (isArray(params)) {
    return `${endpoint}?${map(params, param => checkIfParamIsDate(param)).join(
      '&'
    )}`
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
