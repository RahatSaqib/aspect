import { defineMessages } from 'react-intl'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_DASHBOARD_STATUS: 'REQUEST_DASHBOARD_STATUS',
  RECEIVE_DASHBOARD_STATUS: 'RECEIVE_DASHBOARD_STATUS',
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

/*
 * ---------------- Reducers -----------------
 */
const Dashboard = Immutable.Record({
  status: Immutable.Map(),
})

const initialState = new Dashboard()

export default function dashboardReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DASHBOARD_STATUS:
      return state.remove('status')
    case types.RECEIVE_DASHBOARD_STATUS:
      return state.mergeIn(['status'], action.data)
    default:
      return state
  }
}
