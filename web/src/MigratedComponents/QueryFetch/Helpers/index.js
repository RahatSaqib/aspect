import isArray from 'lodash/isArray'
import map from 'lodash/map'
import values from 'lodash/values'

import DATE_CONSTS from '../../../globals/consts/DateTime/CONSTS'
import { getISOFromString } from '../../../components/shared/DateTimeInput/utils/date'

const { DATE_RANGE_KEYS } = DATE_CONSTS

const checkIfParamIsDate = param => {
  const dateStringMatches = values(DATE_RANGE_KEYS)
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

export { buildBodyParams, buildEndpointAndQueryString, checkIfParamIsDate }
