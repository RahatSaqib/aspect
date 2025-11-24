import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { getFilters } from '../oldComponents/utils'
import screenSchema from '../oldPages/result/ResultScreenSchema.json'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'
import { receiveList, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'
import { downloadFile } from '../utils/utils/files'

const types = {
  REQUEST_RESULTS: 'REQUEST_RESULTS',
  RECEIVE_RESULTS: 'RECEIVE_RESULTS',
  REJECTED_RESULTS: 'REJECTED_RESULTS',
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
    filters,
  }
}

function receiveResults(json) {
  return {
    type: types.RECEIVE_RESULTS,
    items: json.data,
    total: json.total,
    extraColumns: json.extraColumns,
  }
}

function rejectResults() {
  return {
    type: types.REJECTED_RESULTS,
  }
}

// TODO: IMPORTANT!!! THIS FUNCTION SHOULD BE REMOVED ONCE WE MIGRATE ALL THE COMPONENTS WHICH CALLS IT. WE SHOULD USE REACT QUERY INSTEAD OF THIS.
export function fetchResults(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = getFilters(filtersParams)
    dispatch(requestResults(sortCol, sortDir, page, pageSize, filters))
    sortCol = sortCol || 'endedOn'
    return aspectFetch(
      `/result?${stringify({
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
                id: 'errorResponseMessages.fetchResults.GET.400.title',
                defaultMessage: 'Searching Results Failed',
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
                id: 'errorResponseMessages.fetchResults.GET.default.title',
                defaultMessage: 'Loading Results Failed',
              },
            })
          ),
        },
      }
    )
      .then(json => dispatch(receiveResults(json)))
      .catch(() => dispatch(rejectResults()))
  }
}

// TODO: IMPORTANT!!! THIS FUNCTION SHOULD BE REMOVED ONCE WE MIGRATE ALL THE EXPORT COMPONENTS. THE MIGRATED VERSION IS AT THE ResultQueries.js FILE
export function exportResults(filtersParams, format, sortCol, sortDir, page, pageSize, fileFormat, reportName) {
  return () => {
    const filters = getFilters(filtersParams)
    return aspectFetch(
      `/result/export?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        format,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.result.exportResults.GET.400.title',
                defaultMessage: 'Exporting Results Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.result.exportResults.GET.default.title',
                defaultMessage: 'Exporting Results Failed',
              },
            })
          ),
        },
      }
    ).then(async elem => {
      const file = await elem.blob
      downloadFile(file, reportName, fileFormat)
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
    filters: Immutable.fromJS({ sampleId: '', sampleGroup: '', assayId: null }),
    extraColumns: Immutable.List(),
  }),
  deviceLogs: Immutable.List(),
  screenSchema: Immutable.fromJS(screenSchema),
  loading: true,
  formDataSaving: false,
  formDataDirty: false,
})

const initialState = new Result()

export default function resultReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_RESULTS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_RESULTS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total, action.extraColumns))
      })
    case types.REJECTED_RESULTS:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    default:
      return state
  }
}
