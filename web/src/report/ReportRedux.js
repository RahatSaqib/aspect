import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../shared/utils/fetch'
import { nonEmptyFilterValue } from '../filter/utils'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'
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
      .filter(nonEmptyFilterValue)
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
    })}`, {
      errorNotifications: {
        400: filterFieldsRejectedError(defineMessages({
          title: {
            id: 'errorResponseMessages.fetchReports.GET.400.title',
            defaultMessage: 'Searching Reports Failed'
          }
        })),
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.fetchReports.GET.default.title',
            defaultMessage: 'Loading Reports Failed'
          }
        }))
      }
    }).then(json => dispatch(receiveReports(json)))
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
