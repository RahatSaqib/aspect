import { defineMessages } from 'react-intl'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import {
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_DASHBOARD_HOME: 'REQUEST_DASHBOARD_HOME',
  RECEIVE_DASHBOARD_HOME: 'RECEIVE_DASHBOARD_HOME'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestDashboardHome() {
  return {
    type: types.REQUEST_DASHBOARD_HOME
  }
}

function receiveDashboardHome(item) {
  return {
    type: types.RECEIVE_DASHBOARD_HOME,
    item
  }
}

export function fetchDashboardHome() {
  return (dispatch) => {
    dispatch(requestDashboardHome())

    return aspectFetch('/dashboard',
      {
        errorNotifications: {
          default: errorPleaseTryAgainInAFewMinutes(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDashboardHome.GET.default.title',
              defaultMessage: 'Error Loading Dashboard'
            }
          }))
        }
      })
      .then(json => dispatch(receiveDashboardHome(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Dashboard = Immutable.Record({
  home: undefined
})

const initialState = new Dashboard()

export default function dashboardReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DASHBOARD_HOME:
      return state
      .set('home', undefined)
    case types.RECEIVE_DASHBOARD_HOME:
      return state.withMutations((mutState) => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('home', immutItem)
      })
    default:
      return state
  }
}
