import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../utils/utils/fetch'
import { getFilters, mergeToFiltersParams } from '../oldComponents/filter/utils'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'

import { receiveList, receiveItem, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { receivedExportResponse } from './GlobalsRedux'

export const types = {
  REQUEST_ROUTERS: 'REQUEST_ROUTERS',
  RECEIVE_ROUTERS: 'RECEIVE_ROUTERS',
  REJECTED_ROUTERS: 'REJECTED_ROUTERS',

  REQUEST_SINGLE_ROUTER: 'REQUEST_SINGLE_ROUTER',
  RECEIVE_SINGLE_ROUTER: 'RECEIVE_SINGLE_ROUTER',

  REQUEST_UPDATING_SINGLE_ROUTER: 'REQUEST_UPDATING_SINGLE_ROUTER',
  RECEIVE_UPDATED_SINGLE_ROUTER: 'RECEIVE_UPDATED_SINGLE_ROUTER',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestRouters(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_ROUTERS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveRouters(json) {
  return {
    type: types.RECEIVE_ROUTERS,
    items: json.data,
    total: json.total,
  }
}

function rejectRouters() {
  return {
    type: types.REJECTED_ROUTERS,
  }
}

export function fetchRouters(rawFiltersParams, extraFilters = {}, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filtersParams = mergeToFiltersParams(extraFilters, rawFiltersParams)
    const filters = getFilters(filtersParams)
    dispatch(requestRouters(sortCol, sortDir, page, pageSize, filters))

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
                id: 'errorResponseMessages.fetchRouters.GET.400.title',
                defaultMessage: 'Searching Routers Failed',
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
                id: 'errorResponseMessages.fetchRouters.GET.default.title',
                defaultMessage: 'Loading Routers Failed',
              },
            })
          ),
        },
      }
    )
      .then(json => dispatch(receiveRouters(json)))
      .catch(() => dispatch(rejectRouters()))
  }
}
export function exportRouters(
  rawFiltersParams,
  extraFilters = {},
  sortCol,
  sortDir,
  page,
  pageSize,
  fileFormat,
  reportName
) {
  return dispatch => {
    const filtersParams = mergeToFiltersParams(extraFilters, rawFiltersParams)
    const filters = getFilters(filtersParams)

    return aspectFetch(
      `/device/export?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        format: fileFormat,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportRouters.GET.400.title',
                defaultMessage: 'Exporting Routers Failed',
              },
            })
          ),
          403: errorForbidden(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportPersons.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportRouters.GET.default.title',
                defaultMessage: 'Exporting Routers Failed',
              },
            })
          ),
        },
      }
    ).then(async elem => {
      const file = await elem.blob
      dispatch(receivedExportResponse(file, fileFormat, reportName))
    })
  }
}

function requestSingleRouter(routerId) {
  return {
    type: types.REQUEST_SINGLE_ROUTER,
    routerId,
  }
}

function receiveSingleRouter(item) {
  return {
    type: types.RECEIVE_SINGLE_ROUTER,
    item,
  }
}

export function fetchSingleRouter(routerId) {
  return dispatch => {
    dispatch(requestSingleRouter(routerId))

    return aspectFetch(`/device/${routerId}`, {
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleRouter.GET.404.title',
              defaultMessage: 'Could Not Find Router Details',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleRouter.GET.default.title',
              defaultMessage: 'Error Loading Router Details',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSingleRouter(json.data)))
  }
}

function requestUpdatingSingleRouter(routerId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_ROUTER,
    routerId,
    data,
  }
}

function receiveUpdatedSingleRouter(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_ROUTER,
    item,
  }
}

export function updateSingleRouter(routerId, data) {
  return dispatch => {
    dispatch(requestUpdatingSingleRouter(routerId, data))

    return aspectFetch(`/device/${routerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSingleRouter.PUT.default.title',
              defaultMessage: 'An Error Occurred When Trying to Save the Router',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleRouter(json.data)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Router = Immutable.Record({
  items: new Items(),
  table: new Table(),
})

const initialState = new Router()

export default function routerReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_ROUTERS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_ROUTERS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.REJECTED_ROUTERS:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    case types.RECEIVE_SINGLE_ROUTER:
    case types.RECEIVE_UPDATED_SINGLE_ROUTER:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
