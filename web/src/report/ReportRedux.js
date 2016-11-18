import _ from 'lodash'
import Immutable from 'immutable'
import { stringify } from 'querystring'

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
  REQUEST_REPORTS: 'REQUEST_REPORTS',
  RECEIVE_REPORTS: 'RECEIVE_REPORTS'
}
//

/*
 * ---------------- Action Creators -----------------
 */
function requestReports(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_REPORTS,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveReports(json) {
  return {
    type: types.RECEIVE_REPORTS,
    items: json.data,
    total: json.total
  }
}

// With state.filter.listFilter & extraFilters
export function fetchListFilteredReports(extraFilters = {}, ...args) {
  return (dispatch, getState) => {
    const filters = getState()
      .filter
      .listFilter
      .toMap()
      .merge(extraFilters)
      .filter(_.identity)
      .toJS()

    return dispatch(fetchReports(filters, ...args))
  }
}

export function fetchReports(filters/* required */, sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10) {
  return (dispatch) => {
    dispatch(requestReports(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/report?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters
    })}`)
      .then(json => dispatch(receiveReports(json)))
      .catch((err) => {
        dispatch(addError('Loading reports failed', err.message, err))
      })
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Report = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'deploymentName'
  })
})

const initialState = new Report()

export default function reportReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_REPORTS:
      return state
      .set('table', requestTable(state.table, action))
    case types.RECEIVE_REPORTS:
      return state.withMutations((mutState) => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    default:
      return state
  }
}
