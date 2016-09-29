import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

function requestSites(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_SITES,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveSites(json) {
  return {
    type: types.RECEIVE_SITES,
    items: json.data,
    total: json.total
  }
}

export function fetchSites(filters = Immutable.Map({ name: '' }), sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10){
  return dispatch => {

    dispatch(requestSites(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/site?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then(json => dispatch(receiveSites(json)))
      .catch(err => {
        dispatch(addError('Loading sites failed', err.message, err))
      })
  }
}

function requestSingleSite(siteId) {
  return {
    type: types.REQUEST_SINGLE_SITE,
    siteId
  }
}

function receiveSingleSite(item) {
  return {
    type: types.RECEIVE_SINGLE_SITE,
    item
  }
}

export function fetchSingleSite(siteId){
  return dispatch => {

    dispatch(requestSingleSite(siteId))

    return aspectFetch(`/site/${siteId}`)
      .then(json => dispatch(receiveSingleSite(json.data)))
      .catch(err => {
        dispatch(addError(`Loading a site (${siteId}) failed`, err.message, err))
      })
  }
}
