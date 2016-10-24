import _ from 'lodash'
import Immutable from 'immutable'
import { stringify } from 'querystring'

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
  REQUEST_PERSONS: 'REQUEST_PERSONS',
  RECEIVE_PERSONS: 'RECEIVE_PERSONS',

  REQUEST_SINGLE_PERSON: 'REQUEST_SINGLE_PERSON',
  RECEIVE_SINGLE_PERSON: 'RECEIVE_SINGLE_PERSON',

  REQUEST_UPDATING_SINGLE_PERSON: 'REQUEST_UPDATING_SINGLE_PERSON',
  RECEIVE_UPDATED_SINGLE_PERSON: 'RECEIVE_UPDATED_SINGLE_PERSON'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestPersons(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_PERSONS,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receivePersons(json) {
  return {
    type: types.RECEIVE_PERSONS,
    items: json.data,
    total: json.total
  }
}

// With state.filter.listFilter & extraFilters
export function fetchListFilteredPersons(extraFilters = {}, ...args){
  return (dispatch, getState) => {
    const filters = getState()
      .filter
      .listFilter
      .toMap()
      .merge(extraFilters)
      .filter(_.identity)
      .toJS()

    return dispatch(fetchPersons(filters, ...args))
  }
}

export function fetchPersons(filters/* required */, sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10){
  return dispatch => {

    dispatch(requestPersons(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/person?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters
    })}`)
      .then(json => dispatch(receivePersons(json)))
      .catch(err => {
        dispatch(addError('Loading persons failed', err.message, err))
      })
  }
}

// loading a single person with given personId
function requestSinglePerson(personId) {
  return {
    type: types.REQUEST_SINGLE_PERSON,
    personId
  }
}

// received a single person
function receiveSinglePerson(item) {
  return {
    type: types.RECEIVE_SINGLE_PERSON,
    item
  }
}

// load a single person with given personId
export function fetchSinglePerson(personId){
  return dispatch => {

    dispatch(requestSinglePerson(personId))

    return aspectFetch(`/person/${personId}`)
      .then(json => dispatch(receiveSinglePerson(json.data)))
      .catch(err => {
        dispatch(addError(`Loading a person (${personId}) failed`, err.message, err))
      })
  }
}

// updating a single person with given personId and data
function requestUpdatingSinglePerson(personId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_PERSON,
    personId,
    data
  }
}

// received a updated single person
function receiveUpdatedSinglePerson(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_PERSON,
    item
  }
}

// update a single person with given personId and data
export function updateSinglePerson(personId, data){
  return dispatch => {

    dispatch(requestUpdatingSinglePerson(personId, data))

    return aspectFetch(`/person/${personId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
      .then(json => dispatch(receiveUpdatedSinglePerson(json.data)))
      .catch(err => {
        dispatch(addError(`Updating a person (${personId}) failed`, err.message, err))
      })
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Person = Immutable.Record({
  items: new Items(),
  table: new Table()
})

const initialState = new Person()

export default function personReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_PERSONS:
    return state
      .set('table', requestTable(state.table, action))
  case types.RECEIVE_PERSONS:
    return state.withMutations(mutState => {
      const immutList = Immutable.fromJS(action.items)
      mutState.set('items', receiveList(mutState.items, immutList))
      mutState.set('table', receiveTableItems(mutState.table, action.total))
    })
  case types.RECEIVE_SINGLE_PERSON:
  case types.RECEIVE_UPDATED_SINGLE_PERSON:
    return state.withMutations(mutState => {
      const immutItem = Immutable.fromJS(action.item)
      mutState.set('items', receiveItem(mutState.items, immutItem))
    })
  }
  return state
}
