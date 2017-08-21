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
function requestDashboardStatus() {
  return {
    type: types.REQUEST_DASHBOARD_STATUS,
  }
}

function receiveDashboardStatus(data) {
  return {
    type: types.RECEIVE_DASHBOARD_STATUS,
    data,
  }
}

export function fetchDashboardStatus() {
  return dispatch => {
    dispatch(requestDashboardStatus())

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
    }).then(json => dispatch(receiveDashboardStatus(json.data)))
  }
}

function requestOperationalStatus() {
  return {
    type: types.REQUEST_OPERATIONAL_STATUS,
  }
}

function receiveOperationalStatus(data) {
  return {
    type: types.RECEIVE_OPERATIONAL_STATUS,
    data,
  }
}

export function fetchOperationalStatus(filtersParams) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    dispatch(requestOperationalStatus())

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
    ).then(json => dispatch(receiveOperationalStatus(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Dashboard = Immutable.Record({
  status: Immutable.Map(),
  operational: Immutable.Map(),
})

const initialState = new Dashboard()

export default function dashboardReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DASHBOARD_STATUS:
      return state.remove('status')
    case types.RECEIVE_DASHBOARD_STATUS:
      return state.mergeIn(['status'], action.data)
    case types.REQUEST_OPERATIONAL_STATUS:
      return state.remove('operational')
    case types.RECEIVE_OPERATIONAL_STATUS:
      return state.mergeIn(['operational'], action.data)
    default:
      return state
  }
}
