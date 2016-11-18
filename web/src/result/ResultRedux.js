import _ from 'lodash'
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
  REQUEST_RESULTS: 'REQUEST_RESULTS',
  RECEIVE_RESULTS: 'RECEIVE_RESULTS',

  REQUEST_SINGLE_RESULT: 'REQUEST_SINGLE_RESULT',
  RECEIVE_SINGLE_RESULT: 'RECEIVE_SINGLE_RESULT',

  REQUEST_UPDATING_SINGLE_RESULT: 'REQUEST_UPDATING_SINGLE_RESULT',
  RECEIVE_UPDATED_SINGLE_RESULT: 'RECEIVE_UPDATED_SINGLE_RESULT'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestResults(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_RESULTS,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveResults(json) {
  return {
    type: types.RECEIVE_RESULTS,
    items: json.data,
    total: json.total,
    extraColumns: json.extraColumns
  }
}

// With state.filter.listFilter & extraFilters
export function fetchListFilteredResults(extraFilters = {}, ...args) {
  return (dispatch, getState) => {
    const filters = getState()
      .filter
      .listFilter
      .toMap()
      .merge(extraFilters)
      .filter(_.identity)
      .toJS()

    return dispatch(fetchResults(filters, ...args))
  }
}

export function fetchResults(filters/* required */, sortCol = 'endedOn', sortDir = 'desc', page = 0, pageSize = 10) {
  return (dispatch) => {
    dispatch(requestResults(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/result?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters
    })}`)
      .then(json => dispatch(receiveResults(json)))
      .catch((err) => {
        dispatch(addError('Loading results failed', err.message, err))
      })
  }
}

// loading a single result with given resultId
function requestSingleResult(resultId) {
  return {
    type: types.REQUEST_SINGLE_RESULT,
    resultId
  }
}

// received a single result
function receiveSingleResult(item) {
  return {
    type: types.RECEIVE_SINGLE_RESULT,
    item
  }
}

// load a single result with given resultId
export function fetchSingleResult(resultId) {
  return (dispatch) => {
    dispatch(requestSingleResult(resultId))

    return aspectFetch(`/result/${resultId}`)
      .then(json => dispatch(receiveSingleResult(json.data)))
      .catch((err) => {
        dispatch(addError(`Loading a result (${resultId}) failed`, err.message, err))
      })
  }
}

// updating a single result with given resultId and data
function requestUpdatingSingleResult(resultId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_RESULT,
    resultId,
    data
  }
}

// received a updated single result
function receiveUpdatedSingleResult(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_RESULT,
    item
  }
}

// update a single result with given resultId and data
export function updateSingleResult(resultId, data) {
  return (dispatch) => {
    dispatch(requestUpdatingSingleResult(resultId, data))

    return aspectFetch(`/result/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
      .then(json => dispatch(receiveUpdatedSingleResult(json.data)))
      .catch((err) => {
        dispatch(addError(`Updating a result (${resultId}) failed`, err.message, err))
      })
  }
}

// update a single result with given workflow status token
function updateSingleResultWorkflowStatus(resultId, token) {
  return {
    type: types.REQUEST_SINGLE_RESULT,
    resultId,
    token
  }
}

const RESULT_WORKFLOW_STATUS_TOKEN_ACKNOWLEDGED = 'acknowledged'

export function updateResultWorkflowStatus(resultId) {
  return (dispatch) => {
    const token = RESULT_WORKFLOW_STATUS_TOKEN_ACKNOWLEDGED

    dispatch(updateSingleResultWorkflowStatus(resultId, token))

    return aspectFetch(`/result/workflow-status/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify({ token })
    })
      .then(json => dispatch(receiveUpdatedSingleResult(json.data)))
      .catch((err) => {
        dispatch(addError(`Updating a result workflow status (${resultId}) failed`, err.message, err))
      })
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Result = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'endedOn',
    sortDir: 'desc',
    pageSize: 10,
    filters: Immutable.fromJS({ sampleId: '', assayId: null }),
    extraColumns: new Immutable.List()
  })
})

const initialState = new Result()

export default function resultReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_RESULTS:
      return state
      .set('table', requestTable(state.table, action))
    case types.RECEIVE_RESULTS:
      return state.withMutations((mutState) => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total, action.extraColumns))
      })
    case types.RECEIVE_SINGLE_RESULT:
    case types.RECEIVE_UPDATED_SINGLE_RESULT:
      return state.withMutations((mutState) => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
