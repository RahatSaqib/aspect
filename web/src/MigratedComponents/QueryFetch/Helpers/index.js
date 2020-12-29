import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isPlainObject from 'lodash/isPlainObject'

import { checkIfParamsIsDate } from '../../../components/shared/DateTimeInput/utils/date'

const buildEndpointAndQueryString = (endpoint, params) => {
  if (!isEmpty(params) && isPlainObject(params)) {
    return `${endpoint}?${new URLSearchParams(
      checkIfParamsIsDate(params, false)
    ).toString()}`
  }
  if (isArray(params)) {
    return `${endpoint}?${checkIfParamsIsDate(params).join('&')}`
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

export { buildBodyParams, buildEndpointAndQueryString }
