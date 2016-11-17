import { stringify } from 'querystring'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

import {
  receiveList,
  receiveItem,
  Items
} from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_SITES: 'REQUEST_SITES',
  RECEIVE_SITES: 'RECEIVE_SITES',

  REQUEST_SINGLE_SITE: 'REQUEST_SINGLE_SITE',
  RECEIVE_SINGLE_SITE: 'RECEIVE_SINGLE_SITE',

  REQUEST_UPDATING_SINGLE_SITE: 'REQUEST_UPDATING_SINGLE_SITE',
  RECEIVE_UPDATED_SINGLE_SITE: 'RECEIVE_UPDATED_SINGLE_SITE'
}
/*
 * ---------------- Action Creators -----------------
 */
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

export function fetchSites(filters/* required */, sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10) {
  return (dispatch) => {
    dispatch(requestSites(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/site?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then(json => dispatch(receiveSites(json)))
      .catch((err) => {
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
export function fetchSingleSite(siteId) {
  return (dispatch) => {
    dispatch(requestSingleSite(siteId))

    return aspectFetch(`/site/${siteId}`)
      .then(json => dispatch(receiveSingleSite(json.data)))
      .catch((err) => {
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
export function updateSingleSite(siteId, data) {
  return (dispatch) => {
    dispatch(requestUpdatingSingleSite(siteId, data))

    return aspectFetch(`/site/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
      .then(json => dispatch(receiveUpdatedSingleSite(json.data)))
      .catch((err) => {
        dispatch(addError(`Updating a site (${siteId}) failed`, err.message, err))
      })
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Site = Immutable.Record({
  items: new Items(),
  table: new Table()
})

const initialState = new Site()

export default function siteReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_SITES:
      return state
      .set('table', requestTable(state.table, action))
    case types.RECEIVE_SITES:
      return state.withMutations((mutState) => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.RECEIVE_SINGLE_SITE:
    case types.RECEIVE_UPDATED_SINGLE_SITE:
      return state.withMutations((mutState) => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
