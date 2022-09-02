import { stringify } from 'querystring'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import fetchWrapperForQueries from '../components/QueryFetch/index'
import { getFilters } from '../oldComponents/filter/utils'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'
import { receivedFileResponse } from './GlobalsRedux'

export const types = {
  REQUEST_REPORTS: 'REQUEST_REPORTS',
  RECEIVE_REPORTS: 'RECEIVE_REPORTS',
  REJECTED_REPORTS: 'REJECTED_REPORTS',
  REQUEST_REPORTS_FOR_SELECT_LIST: 'REQUEST_REPORTS_FOR_SELECT_LIST',
  RECEIVE_REPORTS_FOR_SELECT_LIST: 'RECEIVE_REPORTS_FOR_SELECT_LIST',
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
    const filters = getFilters(filtersParams)
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
    const filters = getFilters(filtersParams)
    if (!filters.maxDate) filters.maxDate = new Date()
    return fetchWrapperForQueries({
      endpoint: `/reports/${externalId}`,
      params: {
        ...filters,
      },
      customErrorNotifications: {
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
    }).then(async resp => {
      const file = await resp.blob
      dispatch(receivedFileResponse(file, resp.fileName))
    })
  }
}

function requestReportsForSelectList() {
  return {
    type: types.REQUEST_REPORTS_FOR_SELECT_LIST,
  }
}

function receiveReportsForSelectList(reportsForSelectList) {
  return {
    type: types.RECEIVE_REPORTS_FOR_SELECT_LIST,
    items: reportsForSelectList,
    lastRefreshed: new Date(),
  }
}

export function fetchReportsForSelectList(forceRefresh) {
  return (dispatch, getState) => {
    const { report } = getState()

    if (report.selectList.loading) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !report.selectList.lastRefreshed ||
      differenceInMinutes(new Date(), report.selectList.lastRefreshed) > 5
    if (!shouldFetch) {
      return
    }

    dispatch(requestReportsForSelectList())
    /**
     * Notice that reports are bound to job function and we do not pass to
     * API any query params to get list of reports for the AutoComplete
     * field in the Filter popup panel
     */
    return aspectFetch(`/report/select-list`, {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchReportsForSelectList.GET.default.title',
              defaultMessage: 'Loading Reports Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveReportsForSelectList(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const SelectListItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})
export const InitialStateModel = Immutable.Record({
  items: Immutable.List([]),
  loading: true,
  selectList: new SelectListItems(),
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
    case types.REQUEST_REPORTS_FOR_SELECT_LIST:
      return state.setIn(['selectList', 'loading'], true)
    case types.RECEIVE_REPORTS_FOR_SELECT_LIST:
      return state.mergeIn(['selectList'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: Immutable.fromJS(action.items),
      })
    default:
      return state
  }
}
