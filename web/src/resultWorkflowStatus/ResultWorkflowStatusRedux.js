import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_WORKFLOW_STATUSES: 'REQUEST_WORKFLOW_STATUSES',
  RECEIVE_WORKFLOW_STATUSES: 'RECEIVE_WORKFLOW_STATUSES',

  REQUEST_WORKFLOW_LOG: 'REQUEST_WORKFLOW_LOG',
  RECEIVE_WORKFLOW_LOG: 'RECEIVE_WORKFLOW_LOG'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestWorkflowStatuses() {
  return { type: types.REQUEST_WORKFLOW_STATUSES }
}

function createReceiveWorkflowStatuses(items) {
  return {
    type: types.RECEIVE_WORKFLOW_STATUSES,
    items,
    lastRefreshed: new Date()
  }
}

export function fetchWorkflowStatuses(forceRefresh) {
  return (dispatch, getState) => {
    const { resultWorkflowStatus: workflowStatus } = getState()

    if (workflowStatus.loading) {
      return
    }
    const shouldFetch = forceRefresh || !workflowStatus.lastRefreshed || (
      // check every 60 mins in case new option added in db
      differenceInMinutes(new Date(), workflowStatus.lastRefreshed) > 60
    )
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestWorkflowStatuses())
    return aspectFetch('/result/workflow-status-types',
      {
        errorNotifications: {
          400: filterFieldsRejectedError(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchWorkflowStatuses.GET.400.title',
              defaultMessage: 'Searching Result Workflow Statuses Failed'
            }
          })),
          default: errorPleaseTryAgainInAFewMinutes(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchWorkflowStatuses.GET.default.title',
              defaultMessage: 'Loading Result Workflow Statuses Failed'
            }
          }))
        }
      })
      .then(json => dispatch(createReceiveWorkflowStatuses(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const WorkflowStatus = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})

const initialState = new WorkflowStatus()

function requestWorkflowStatuses(state) {
  return state.set('loading', true)
}

function receiveWorkflowStatuses(state, items, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: new Immutable.fromJS(items),
  })
}

export default function workflowStatusReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_WORKFLOW_STATUSES:
      return requestWorkflowStatuses(state)
    case types.RECEIVE_WORKFLOW_STATUSES:
      return receiveWorkflowStatuses(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
