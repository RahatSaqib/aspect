import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { getFilters } from '../oldComponents/filter/utils'
import screenSchema from '../oldPages/result/ResultScreenSchema.json'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'
import { receiveList, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'
import { receivedExportResponse } from './GlobalsRedux'

export const types = {
  REQUEST_RESULTS: 'REQUEST_RESULTS',
  RECEIVE_RESULTS: 'RECEIVE_RESULTS',
  REJECTED_RESULTS: 'REJECTED_RESULTS',

  REQUEST_SINGLE_RESULT: 'REQUEST_SINGLE_RESULT',
  RECEIVE_SINGLE_RESULT: 'RECEIVE_SINGLE_RESULT',

  REQUEST_UPDATING_SINGLE_RESULT: 'REQUEST_UPDATING_SINGLE_RESULT',
  RECEIVE_UPDATED_SINGLE_RESULT: 'RECEIVE_UPDATED_SINGLE_RESULT',

  REQUEST_CREATING_RESULT_NOTE: 'REQUEST_CREATING_RESULT_NOTE',
  RECEIVE_CREATING_RESULT_NOTE: 'RECEIVE_CREATING_RESULT_NOTE',

  REQUEST_CREATING_TREATMENT_STATUS_LOG: 'REQUEST_CREATING_TREATMENT_STATUS_LOG',
  RECEIVE_CREATING_TREATMENT_STATUS_LOG: 'RECEIVE_CREATING_TREATMENT_STATUS_LOG',

  REQUEST_WORKFLOW_LOG: 'REQUEST_WORKFLOW_LOG',
  RECEIVE_WORKFLOW_LOG: 'RECEIVE_WORKFLOW_LOG',

  REQUEST_RESULT_LOG: 'REQUEST_RESULT_LOG',
  RECEIVE_RESULT_LOG: 'RECEIVE_RESULT_LOG',

  SAVING_RESULT_FORM_DATA: 'SAVING_RESULT_FORM_DATA',
  SAVING_RESULT_FORM_DATA_COMPLETE: 'SAVING_RESULT_FORM_DATA_COMPLETE',
  SET_RESULT_FORM_DATA_VALUE: 'SET_RESULT_FORM_DATA_VALUE',
}

/*
 * ---------------- Action Creators -----------------
 */

// updating a single result with given resultId and data
function requestCreatingResultNote(resultId) {
  return {
    type: types.REQUEST_CREATING_RESULT_NOTE,
    resultId,
  }
}

// received a updated single result
function receiveResultNote(item, resultId) {
  return {
    type: types.RECEIVE_CREATING_RESULT_NOTE,
    resultId,
    item,
  }
}

export function addResultNote(resultId, data) {
  return dispatch => {
    dispatch(requestCreatingResultNote(resultId))

    return aspectFetch(`/result/result-note/${resultId}`, {
      method: 'POST',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSingleResult.PUT.default.title',
              defaultMessage: 'An Error Occurred When Trying to Save the Result',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveResultNote(json.data, resultId)))
  }
}

// request device log
function requestDeviceLogs() {
  return {
    type: types.REQUEST_RESULT_LOG,
  }
}

// received result logs
function receiveResultLogs(item) {
  return {
    type: types.RECEIVE_RESULT_LOG,
    item,
  }
}

// load a single result log with given resultId
export function fetchResultLog(resultId) {
  return dispatch => {
    dispatch(requestDeviceLogs())

    return aspectFetch(`/result/device-logs/${resultId}`, {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceLog.GET.default.title',
              defaultMessage: 'Error Loading Result Logs',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveResultLogs(json.data)))
  }
}

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

/*
 * ---------------- Result Workflow Status Logs -----------------
 */

// TODO: IMPORTANT!!! THIS FUNCTION SHOULD BE REMOVED ONCE WE MIGRATE ALL THE EXPORT COMPONENTS. THE MIGRATED VERSION IS AT THE ResultQueries.js FILE
export function exportResults(filtersParams, format, sortCol, sortDir, page, pageSize, fileFormat, reportName) {
  return dispatch => {
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
                id: 'errorResponseMessages.exportResults.GET.400.title',
                defaultMessage: 'Exporting Results Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportResults.GET.default.title',
                defaultMessage: 'Exporting Results Failed',
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

/*
 * ---------------- Reducers -----------------
 */
export const WorkflowLogModel = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'changedOn',
    sortDir: 'desc',
    page: 0,
    pageSize: 10,
  }),
})

export const Result = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'endedOn',
    sortDir: 'desc',
    pageSize: 10,
    filters: Immutable.fromJS({ sampleId: '', sampleGroup: '', assayId: null }),
    extraColumns: Immutable.List(),
  }),
  workflowLog: new WorkflowLogModel(),
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
    case types.SET_RESULT_FORM_DATA_VALUE:
      return state
        .withMutations(mutState => {
          const formData = {}
          formData[action.formFieldKey] = action.value
          mutState.set('items', mutState.items.mergeDeepIn(['byId', action.resultId], Immutable.fromJS({ formData })))
        })
        .merge({ formDataDirty: true })
    case types.SAVING_RESULT_FORM_DATA:
      return state.merge({
        formDataSaving: true,
      })
    case types.SAVING_RESULT_FORM_DATA_COMPLETE:
      return state.merge({
        formDataSaving: false,
      })
    case types.REQUEST_RESULT_LOG:
      return state.merge({
        loading: true,
      })
    case types.RECEIVE_RESULT_LOG:
      return state.merge({
        deviceLogs: Immutable.List(action.item),
        loading: false,
      })

    case types.REQUEST_WORKFLOW_LOG:
      return state.withMutations(mutState => {
        const workflowLog = mutState.workflowLog.mergeIn(['table'], requestTable(mutState.workflowLog.table, action))
        mutState.set('workflowLog', workflowLog)
      })
    case types.RECEIVE_WORKFLOW_LOG:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        const workflowLog = mutState.workflowLog.withMutations(mutLog => {
          mutLog.set('items', receiveList(mutLog.items, immutList))
          mutLog.set('table', receiveTableItems(mutLog.table, action.total, action.extraColumns))
        })
        mutState.set('workflowLog', workflowLog)
      })

    case types.RECEIVE_CREATING_TREATMENT_STATUS_LOG:
      return state.withMutations(mutState => {
        const {
          resultTreatmentStatus,
          treatmentStatusInfo,
          resultTreatmentStatusChangedOn,
          resultTreatmentStatusCreatedOn,
        } = action.item
        mutState.set(
          'items',
          mutState.items.mergeDeepIn(
            ['byId', action.resultId],
            Immutable.fromJS({
              resultTreatmentStatus,
              treatmentStatusInfo,
              resultTreatmentStatusChangedOn,
              resultTreatmentStatusCreatedOn,
            })
          )
        )
      })
    case types.RECEIVE_CREATING_RESULT_NOTE:
      return state.withMutations(mutState => {
        const resultNotes = Immutable.fromJS(action.item)
        mutState.set(
          'items',
          mutState.items.mergeDeepIn(['byId', action.resultId], {
            resultNotes,
          })
        )
      })
    default:
      return state
  }
}
