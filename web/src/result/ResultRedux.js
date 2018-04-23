import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  errorNotFound,
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../error/CommonErrorNotifications'
import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'
import { receivedExportResponse } from '../filter/FilterRedux'
import screenSchema from './ResultScreenSchema.json'

export const types = {
  REQUEST_RESULTS: 'REQUEST_RESULTS',
  RECEIVE_RESULTS: 'RECEIVE_RESULTS',

  REQUEST_SINGLE_RESULT: 'REQUEST_SINGLE_RESULT',
  RECEIVE_SINGLE_RESULT: 'RECEIVE_SINGLE_RESULT',

  REQUEST_UPDATING_SINGLE_RESULT: 'REQUEST_UPDATING_SINGLE_RESULT',
  RECEIVE_UPDATED_SINGLE_RESULT: 'RECEIVE_UPDATED_SINGLE_RESULT',

  REQUEST_WORKFLOW_LOG: 'REQUEST_WORKFLOW_LOG',
  RECEIVE_WORKFLOW_LOG: 'RECEIVE_WORKFLOW_LOG',

  REQUEST_RESULT_LOG: 'REQUEST_RESULT_LOG',
  RECEIVE_RESULT_LOG: 'RECEIVE_RESULT_LOG',
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

export function fetchResults(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    dispatch(requestResults(sortCol, sortDir, page, pageSize, filters))

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
                id: 'errorResponseMessages.fetchResults.GET.default.title',
                defaultMessage: 'Loading Results Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveResults(json)))
  }
}

// loading a single result with given resultId
function requestSingleResult(resultId) {
  return {
    type: types.REQUEST_SINGLE_RESULT,
    resultId,
  }
}

// received a single result
function receiveSingleResult(item) {
  return {
    type: types.RECEIVE_SINGLE_RESULT,
    item,
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
// load a single result with given resultId
export function fetchSingleResult(resultId) {
  return dispatch => {
    dispatch(requestSingleResult(resultId))

    return aspectFetch(`/result/${resultId}`, {
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleResult.GET.404.title',
              defaultMessage: 'Could Not Find Test Result',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleResult.GET.default.title',
              defaultMessage: 'Error Loading Result Details',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSingleResult(json.data)))
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
              id: 'errorResponseMessages.fetchSingleResult.GET.default.title',
              defaultMessage: 'Error Loading Result Logs',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveResultLogs(json.data)))
  }
}

// updating a single result with given resultId and data
function requestUpdatingSingleResult(resultId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_RESULT,
    resultId,
    data,
  }
}

// received a updated single result
function receiveUpdatedSingleResult(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_RESULT,
    item,
  }
}

// update a single result with given resultId and data
export function updateSingleResult(resultId, data) {
  return dispatch => {
    dispatch(requestUpdatingSingleResult(resultId, data))

    return aspectFetch(`/result/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSingleResult.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to Save the Result',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleResult(json.data)))
  }
}

// update a single result with given workflow status externalId
function updateSingleResultWorkflowStatus(resultId, externalId) {
  return {
    type: types.REQUEST_SINGLE_RESULT,
    resultId,
    externalId,
  }
}

const RESULT_WORKFLOW_STATUS_EXTERNALID_ACKNOWLEDGED = 'Acknowledged'

export function updateResultWorkflowStatus(resultId) {
  return dispatch => {
    const externalId = RESULT_WORKFLOW_STATUS_EXTERNALID_ACKNOWLEDGED

    dispatch(updateSingleResultWorkflowStatus(resultId, externalId))

    return aspectFetch(`/result/workflow-status/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify({ externalId }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateResultWorkflowStatus.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to Save the Workflow Status',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleResult(json.data)))
  }
}

// update a single result's QC Check flag
function updateSingleResultQcCheck(resultId, qcCheck) {
  return {
    type: types.REQUEST_SINGLE_RESULT,
    resultId,
    qcCheck,
  }
}

export function updateResultQcCheck(resultId, qcCheck) {
  return dispatch => {
    dispatch(updateSingleResultQcCheck(resultId, qcCheck))

    return aspectFetch(`/result/qc-check/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify({ qcCheck }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateResultQcCheck.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to update the "QC Check" flag.',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleResult(json.data)))
  }
}

/*
 * ---------------- Result Workflow Status Logs -----------------
 */
// action for setting table's prop loading:true
function requestWorkflowStatusLogsAction(sortCol, sortDir, page, size) {
  return {
    type: types.REQUEST_WORKFLOW_LOG,
    sortCol,
    sortDir,
    page,
    size,
  }
}

// received list of workflow-status-logs
function receiveWorkflowStatusLogsAction(json) {
  return {
    type: types.RECEIVE_WORKFLOW_LOG,
    items: json.data,
    total: json.total,
  }
}

// load a list of workflow-status-logs for given resultId
export function fetchWorkflowStatusLogs(
  resultId,
  sortCol = 'changedOn',
  sortDir = 'desc',
  page = 0,
  pageSize = 10
) {
  return dispatch => {
    // action to set table's prop loading:true
    dispatch(requestWorkflowStatusLogsAction(sortCol, sortDir, page, pageSize))

    // request sorted/paged dataset from api
    return aspectFetch(
      `/result/workflow-status-logs/${resultId}?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchWorkflowLogs.GET.400.title',
                defaultMessage: 'Searching Result Workflow Status Logs Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchWorkflowLogs.GET.default.title',
                defaultMessage: 'Loading Result Workflow Status Logs Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveWorkflowStatusLogsAction(json)))
  }
}

export function exportResults(
  filtersParams,
  format,
  sortCol,
  sortDir,
  page,
  pageSize
) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
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
    ).then(json => {
      dispatch(receivedExportResponse(format, json))
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
    extraColumns: new Immutable.List(),
  }),
  workflowLog: new WorkflowLogModel(),
  deviceLogs: new Immutable.List(),
  screenSchema: new Immutable.fromJS(screenSchema),
  loading: true,
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
        mutState.set(
          'table',
          receiveTableItems(mutState.table, action.total, action.extraColumns)
        )
      })
    case types.RECEIVE_SINGLE_RESULT:
    case types.RECEIVE_UPDATED_SINGLE_RESULT:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.REQUEST_RESULT_LOG:
      return state.merge({
        loading: true,
      })
    case types.RECEIVE_RESULT_LOG:
      return state.merge({
        deviceLogs: action.item,
        loading: false,
      })

    case types.REQUEST_WORKFLOW_LOG:
      return state.withMutations(mutState => {
        const workflowLog = mutState.workflowLog.mergeIn(
          ['table'],
          requestTable(mutState.workflowLog.table, action)
        )
        mutState.set('workflowLog', workflowLog)
      })
    case types.RECEIVE_WORKFLOW_LOG:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        const workflowLog = mutState.workflowLog.withMutations(mutLog => {
          mutLog.set('items', receiveList(mutLog.items, immutList))
          mutLog.set(
            'table',
            receiveTableItems(mutLog.table, action.total, action.extraColumns)
          )
        })
        mutState.set('workflowLog', workflowLog)
      })

    default:
      return state
  }
}
