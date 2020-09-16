import { stringify } from 'querystring'
import fromPairs from 'lodash/fromPairs'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetchFile, aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../error/CommonErrorNotifications'
import { receivedFileResponse } from '../globals/GlobalsRedux'

export const types = {
  REQUEST_REPORTS: 'REQUEST_REPORTS',
  RECEIVE_REPORTS: 'RECEIVE_REPORTS',
  REJECTED_REPORTS: 'REJECTED_REPORTS',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestReports(filters) {
  return {
    type: types.REQUEST_REPORTS,
    filters,
  }
}

function receiveReports(json) {
  return {
    type: types.RECEIVE_REPORTS,
    items: json.data,
    total: json.total,
    extraColumns: json.extraColumns,
  }
}

function rejectReports() {
  return {
    type: types.REJECTED_REPORTS,
  }
}

export function fetchReports(filtersParams) {
  return dispatch => {
    const filters = fromPairs([...filtersParams.entries()])
    dispatch(requestReports(filters))
    return aspectFetch(
      `/reports?${stringify({
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchReports.GET.400.title',
                defaultMessage: 'Searching Reports Failed',
              },
            })
          ),
          403: errorForbidden(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchReports.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchReports.GET.default.title',
                defaultMessage: 'Loading Reports Failed',
              },
            })
          ),
        },
      }
    )
      .then(json => dispatch(receiveReports(json)))
      .catch(() => dispatch(rejectReports()))
  }
}

export function getReportFile(externalId, filtersParams) {
  return dispatch => {
    const filters = fromPairs([...filtersParams.entries()])
    return aspectFetchFile(
      `/reports/${externalId}?${stringify({
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.getReportFile.GET.400.title',
                defaultMessage: 'Getting Report File Failed',
              },
            })
          ),
          403: errorForbidden(
            defineMessages({
              title: {
                id: 'errorResponseMessages.getReportFile.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.getReportFile.GET.default.title',
                defaultMessage: 'Getting Report File Failed',
              },
            })
          ),
        },
      }
    ).then(async resp => {
      const file = await resp.blob
      dispatch(receivedFileResponse(file, resp.fileName))
    })
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const InitialStateModel = Immutable.Record({
  items: Immutable.List([]),
  loading: true,
})

const initialState = new InitialStateModel()

export default function resultReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_REPORTS:
      return state.merge({
        loading: true,
      })
    case types.RECEIVE_REPORTS:
      return state.withMutations(mutState => {
        mutState.set('loading', false)
        mutState.set('items', Immutable.fromJS(action.items))
      })
    case types.REJECTED_REPORTS:
      return state.withMutations(mutState => {
        mutState.set('loading', true)
        mutState.set('items', Immutable.fromJS([]))
      })
    default:
      return state
  }
}
