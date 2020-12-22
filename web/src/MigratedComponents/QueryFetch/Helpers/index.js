import isArray from 'lodash/isArray'
import map from 'lodash/map'
import values from 'lodash/values'
import forEach from 'lodash/forEach'

import GRAPH_CONSTS from '../../Graphs/GraphConfigurations/CONSTS'
import INVENTORY_CONSTS from '../../../inventory/adjustment/CONSTS'
import { getISOFromString } from '../../Graphs/Helpers/Formatters/datetime'

const dateStringMatches = [
  ...values(GRAPH_CONSTS.DATE_RANGE_KEYS),
  ...values(INVENTORY_CONSTS.DATE_KEYS),
]

const formatParam = (key, value) =>
  dateStringMatches.includes(key) ? getISOFromString(value) : value

const formatQueryParam = param => {
  const [key, value] = Object.entries(param)[0]
  return `${key}=${formatParam(key, value)}`
}

const buildEndpointAndQueryString = (endpoint, params) => {
  if (Object.keys(params).length !== 0 && params.constructor === Object) {
    return `${endpoint}?${new URLSearchParams(params).toString()}`
  }
  if (isArray(params)) {
    return `${endpoint}?${map(params, param => formatQueryParam(param)).join(
      '&'
    )}`
  }
  return endpoint
}

const buildBodyParams = (endpoint, params) => {
  let formattedParams = params

  forEach(params, (value, key) => {
    formattedParams = { ...formattedParams, [key]: formatParam(key, value) }
  })

  switch (endpoint) {
    case '/result/confirmed-treatment-tracking':
      return JSON.stringify({})

    default:
      return JSON.stringify(formattedParams)
  }
}

export { buildBodyParams, buildEndpointAndQueryString, formatQueryParam }
