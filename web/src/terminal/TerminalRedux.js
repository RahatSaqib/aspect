import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import { mergeToFiltersParams } from '../filter/utils'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
} from '../error/CommonErrorNotifications'

import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_TERMINALS: 'REQUEST_TERMINALS',
  RECEIVE_TERMINALS: 'RECEIVE_TERMINALS',

  REQUEST_SINGLE_TERMINAL: 'REQUEST_SINGLE_TERMINAL',
  RECEIVE_SINGLE_TERMINAL: 'RECEIVE_SINGLE_TERMINAL',

  REQUEST_UPDATING_SINGLE_TERMINAL: 'REQUEST_UPDATING_SINGLE_TERMINAL',
  RECEIVE_UPDATED_SINGLE_TERMINAL: 'RECEIVE_UPDATED_SINGLE_TERMINAL',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestTerminals(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_TERMINALS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveTerminals(json) {
  return {
    type: types.RECEIVE_TERMINALS,
    items: json.data,
    total: json.total,
  }
}

export function fetchTerminals(
  rawFiltersParams,
  extraFilters = {},
  sortCol,
  sortDir,
  page,
  pageSize
) {
  return dispatch => {
    const filtersParams = mergeToFiltersParams(extraFilters, rawFiltersParams)
    const filters = _.fromPairs([...filtersParams.entries()])
    dispatch(requestTerminals(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/device?${stringify({
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
                id: 'errorResponseMessages.fetchTerminals.GET.400.title',
                defaultMessage: 'Searching Terminals Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchTerminals.GET.default.title',
                defaultMessage: 'Loading Terminals Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveTerminals(json)))
  }
}

function requestSingleTerminal(terminalId) {
  return {
    type: types.REQUEST_SINGLE_TERMINAL,
    terminalId,
  }
}

function receiveSingleTerminal(item) {
  return {
    type: types.RECEIVE_SINGLE_TERMINAL,
    item,
  }
}

export function fetchSingleTerminal(terminalId) {
  return dispatch => {
    dispatch(requestSingleTerminal(terminalId))

    return aspectFetch(`/device/${terminalId}`, {
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleTerminal.GET.404.title',
              defaultMessage: 'Could Not Find Terminal Details',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleTerminal.GET.default.title',
              defaultMessage: 'Error Loading Terminal Details',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSingleTerminal(json.data)))
  }
}

function requestUpdatingSingleTerminal(terminalId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_TERMINAL,
    terminalId,
    data,
  }
}

function receiveUpdatedSingleTerminal(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_TERMINAL,
    item,
  }
}

export function updateSingleTerminal(terminalId, data) {
  return dispatch => {
    dispatch(requestUpdatingSingleTerminal(terminalId, data))

    return aspectFetch(`/device/${terminalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateSingleTerminal.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to Save the Terminal',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleTerminal(json.data)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Terminal = Immutable.Record({
  items: new Items(),
  table: new Table(),
})

const initialState = new Terminal()

export default function terminalReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_TERMINALS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_TERMINALS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.RECEIVE_SINGLE_TERMINAL:
    case types.RECEIVE_UPDATED_SINGLE_TERMINAL:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
