import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../error/CommonErrorNotifications'
import { receiveList, Items } from '../shared/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../shared/metaReducers/table'
import { getFilters } from '../filter/utils'

export const types = {
  REQUEST_CASES: 'REQUEST_CASES',
  RECEIVE_CASES: 'RECEIVE_CASES',
  REJECTED_CASES: 'REJECTED_CASES',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestCases(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_CASES,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveCases(json) {
  return {
    type: types.RECEIVE_CASES,
    items: json.data,
    total: json.total,
  }
}

function rejectCases() {
  return {
    type: types.REJECTED_CASES,
  }
}

export function fetchCases(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = getFilters(filtersParams)
    dispatch(requestCases(sortCol, sortDir, page, pageSize, filters))
    sortCol = sortCol || 'createdOn'
    return aspectFetch(
      `/case?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchCases.GET.400.title',
                defaultMessage: 'Searching Cases Failed',
              },
            })
          ),
          403: errorForbidden(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchPersons.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchCases.GET.default.title',
                defaultMessage: 'Loading Cases Failed',
              },
            })
          ),
        },
      }
    )
      .then(json => dispatch(receiveCases(json)))
      .catch(() => dispatch(rejectCases()))
  }
}

export const Case = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'createdOn',
    sortDir: 'desc',
    pageSize: 10,
    filters: Immutable.fromJS({
      countryId: null,
      stateId: null,
      lgaId: null,
      diseaseId: null,
      sampleOriginSiteId: null,
      caseId: '',
    }),
  }),
  loading: true,
})

const initialState = new Case()

export default function caseReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_CASES:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_CASES:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.REJECTED_CASES:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    default:
      return state
  }
}
