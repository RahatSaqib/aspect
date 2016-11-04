import { stringify } from 'querystring'
import Immutable from 'immutable'
import _ from 'lodash'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'
import {
  receiveList,
  Items
} from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_RESULTS: 'REQUEST_RESULTS',
  RECEIVE_RESULTS: 'RECEIVE_RESULTS'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestResults(sortCol, sortDir, page, size, filters, assayColumns) {
  return {
    type: types.REQUEST_RESULTS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
    assayColumns
  }
}

function receiveResults(json) {
  return {
    type: types.RECEIVE_RESULTS,
    items: json.data,
    total: json.total
  }
}

export function fetchResults(filters = Immutable.Map({ sampleId: '', assayId: null }), sortCol = 'endedOn', sortDir = 'desc', page = 0, pageSize = 20, assayColumns = []){
  return dispatch => {

    dispatch(requestResults(sortCol, sortDir, page, pageSize, filters, assayColumns))

    const jsonFields = _.join(_.without(_.map(assayColumns, 'db'), 'resultCategory1Name', 'resultCategory2Name'), '&jsonFields=')
    return aspectFetch(`/result?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}&jsonFields=${jsonFields}`)
      .then(json => dispatch(receiveResults(json)))
      .catch(err => {
        dispatch(addError('Loading results failed', err.message, err))
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
    pageSize: 20,
    filters: Immutable.fromJS({ sampleId: '', assayId: null })
  }),
  assayColumns: new Immutable.List()
})

const initialState = new Result()

export default function resultReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_RESULTS:
    return state
      .set('table', requestTable(state.table, action))
      .set('assayColumns', Immutable.fromJS(action.assayColumns))
  case types.RECEIVE_RESULTS:
    return state.withMutations(mutState => {
      const immutList = Immutable.fromJS(action.items)
      mutState.set('items', receiveList(mutState.items, immutList))
      mutState.set('table', receiveTableItems(mutState.table, action.total))
    })
  }
  return state
}
