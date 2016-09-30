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

// loading a single site with given siteId
function requestSingleSite(siteId) {
  return {
    type: types.REQUEST_SINGLE_SITE,
    siteId
  }
}

// received a single site
function receiveSingleSite(item) {
  return {
    type: types.RECEIVE_SINGLE_SITE,
    item
  }
}

// load a single site with given siteId
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

// updating a single site with given siteId and data
function requestUpdatingSingleSite(siteId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_SITE,
    siteId,
    data
  }
}

// received a updated single site
function receiveUpdatedSingleSite(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_SITE,
    item
  }
}

// update a single site with given siteId and data
export function updateSingleSite(siteId, data){
  return dispatch => {

    dispatch(requestUpdatingSingleSite(siteId, data))

    return aspectFetch(`/site/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
      .then(json => dispatch(receiveUpdatedSingleSite(json.data)))
      .catch(err => {
        dispatch(addError(`Updating a site (${siteId}) failed`, err.message, err))
      })
  }
}
