import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../error/CommonErrorNotifications'

import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_REPORTERS: 'REQUEST_REPORTERS',
  RECEIVE_REPORTERS: 'RECEIVE_REPORTERS',

  REQUEST_UPDATING_SINGLE_REPORTER: 'REQUEST_UPDATING_SINGLE_REPORTER',
  RECEIVE_UPDATED_SINGLE_REPORTER: 'RECEIVE_UPDATED_SINGLE_REPORTER',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestReporters(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_REPORTERS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveReporters(json) {
  return {
    type: types.RECEIVE_REPORTERS,
    items: json.data,
    total: json.total,
  }
}

export function fetchReporters(
  filtersParams,
  sortCol,
  sortDir,
  page,
  pageSize
) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    dispatch(requestReporters(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/person/reporter?${stringify({
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
                id: 'errorResponseMessages.fetchReporters.GET.400.title',
                defaultMessage: 'Searching Reporters Failed',
              },
            })
          ),
          403: errorInsufficientScope(
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
                id: 'errorResponseMessages.fetchReporters.GET.default.title',
                defaultMessage: 'Loading Reporters Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveReporters(json)))
  }
}

function requestUpdatingSingleReporter(reporterId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_REPORTER,
    reporterId,
    data,
  }
}

function receiveUpdatedSingleReporter(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_REPORTER,
    item,
  }
}

export function updateSingleReporter(reporterId, data) {
  return dispatch => {
    dispatch(requestUpdatingSingleReporter(reporterId, data))
    return aspectFetch(`/person/reporter/${reporterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        404: errorNotFound(	
          defineMessages({	
            title: {	
              id: 'errorResponseMessages.updateSingleReporter.GET.404.title',	
              defaultMessage: 'Could Not Find Reporter',	
            },	
          })	
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateSingleReporter.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to Save the Reporter',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleReporter(json.data)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Reporter = Immutable.Record({
  items: new Items(),
  table: new Table(),
})

const initialState = new Reporter()

export default function reporterReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_REPORTERS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_REPORTERS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.RECEIVE_UPDATED_SINGLE_REPORTER:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
