import map from 'lodash/map'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isPlainObject from 'lodash/isPlainObject'

import { checkIfParamsIsDate } from '../../../oldComponents/shared/DateTimeInput/utils/date'

const buildEndpointAndQueryString = (endpoint, params) => {
  if ((!isEmpty(params) && isPlainObject(params)) || isArray(params)) {
    return `${endpoint}?${checkIfParamsIsDate(params).join('&')}`
  }
  return endpoint
}
function replaceRouteParams(route, routeParams) {
  let newRoute = route
  map(routeParams, (paramValue, paramKey) => (newRoute = newRoute.replace(`:${paramKey}`, paramValue)))
  return newRoute
}

const buildBodyParams = (endpoint, params) => {
  switch (endpoint) {
    default:
      return JSON.stringify(params)
  }
}

export { buildBodyParams, buildEndpointAndQueryString, replaceRouteParams }
