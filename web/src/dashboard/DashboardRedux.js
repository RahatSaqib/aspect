import { stringify } from 'querystring'
import _ from 'lodash'
import { defineMessages } from 'react-intl'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_DASHBOARD_STATUS: 'REQUEST_DASHBOARD_STATUS',
  RECEIVE_DASHBOARD_STATUS: 'RECEIVE_DASHBOARD_STATUS',

  REQUEST_OPERATIONAL_STATUS: 'REQUEST_OPERATIONAL_STATUS',
  RECEIVE_OPERATIONAL_STATUS: 'RECEIVE_OPERATIONAL_STATUS',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestDashboardStatus(requestedAt) {
  return {
    type: types.REQUEST_DASHBOARD_STATUS,
    requestedAt,
  }
}

function receiveDashboardStatus(requestedAt, data) {
  return {
    type: types.RECEIVE_DASHBOARD_STATUS,
    requestedAt,
    data,
  }
}

export function fetchDashboardStatus() {
  return dispatch => {
    const requestedAt = Date.now()
    dispatch(requestDashboardStatus(requestedAt))

    return aspectFetch('/dashboard', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchDashboardStatus.GET.default.title',
              defaultMessage: 'Error Loading Dashboard Status',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveDashboardStatus(requestedAt, json.data)))
  }
}

function requestOperationalStatus(requestedAt) {
  return {
    type: types.REQUEST_OPERATIONAL_STATUS,
    requestedAt,
  }
}

function receiveOperationalStatus(requestedAt, data) {
  return {
    type: types.RECEIVE_OPERATIONAL_STATUS,
    requestedAt,
    data,
  }
}

export function fetchOperationalStatus(filtersParams) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    const requestedAt = Date.now()
    dispatch(requestOperationalStatus(requestedAt))

    return aspectFetch(
      `/dashboard/operational?${stringify({
        ...filters,
      })}`,
      {
        errorNotifications: {
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id:
                  'errorResponseMessages.receiveOperationalStatus.GET.default.title',
                defaultMessage: 'Error Loading Operational Data',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveOperationalStatus(requestedAt, json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Dashboard = Immutable.Record({
  requestedAt: undefined,
  status: Immutable.Map(),
  operational: Immutable.Map(),
})

const initialState = new Dashboard()

export default function dashboardReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DASHBOARD_STATUS:
      return state.set('requestedAt', action.requestedAt)
    case types.RECEIVE_DASHBOARD_STATUS:
      return state.requestedAt === action.requestedAt
        ? state.merge({
            requestedAt: undefined,
            status: action.data,
          })
        : state
    case types.REQUEST_OPERATIONAL_STATUS:
      return state.set('requestedAt', action.requestedAt)
    case types.RECEIVE_OPERATIONAL_STATUS:
      return state.requestedAt === action.requestedAt
        ? state.merge({
            requestedAt: undefined,
            operational: action.data,
          })
        : state
    default:
      return state
  }
}
