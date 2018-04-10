import { stringify } from 'querystring'
import _ from 'lodash'
import { defineMessages } from 'react-intl'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../error/CommonErrorNotifications'

export const REQUEST_STAT_DASHBOARD = 'REQUEST_STAT_DASHBOARD'
export const RECEIVE_STAT_DASHBOARD = 'RECEIVE_STAT_DASHBOARD'

export const REQUEST_TARGET_DASHBOARD = 'REQUEST_TARGET_DASHBOARD'
export const RECEIVE_TARGET_DASHBOARD = 'RECEIVE_TARGET_DASHBOARD'

export const REQUEST_RESULT_DASHBOARD = 'REQUEST_RESULT_DASHBOARD'
export const RECEIVE_RESULT_DASHBOARD = 'RECEIVE_RESULT_DASHBOARD'

export const REQUEST_INVENTORY_ITEM_DASHBOARD =
  'REQUEST_INVENTORY_ITEM_DASHBOARD'
export const RECEIVE_INVENTORY_ITEM_DASHBOARD =
  'RECEIVE_INVENTORY_ITEM_DASHBOARD'

export const REQUEST_DEVICE_DASHBOARD = 'REQUEST_DEVICE_DASHBOARD'
export const RECEIVE_DEVICE_DASHBOARD = 'RECEIVE_DEVICE_DASHBOARD'

export const REQUEST_SITE_DASHBOARD = 'REQUEST_SITE_DASHBOARD'
export const RECEIVE_SITE_DASHBOARD = 'RECEIVE_SITE_DASHBOARD'

export const REQUEST_OPERATIONAL_STATUS = 'REQUEST_OPERATIONAL_STATUS'
export const RECEIVE_OPERATIONAL_STATUS = 'RECEIVE_OPERATIONAL_STATUS'

export const REQUEST_ACTION_STATUS = 'REQUEST_ACTION_STATUS'
export const RECEIVE_ACTION_STATUS = 'RECEIVE_ACTION_STATUS'
/*
 * ---------------- Action Creators -----------------
 */
function requestStatDashboard(requestedAt) {
  return {
    type: REQUEST_STAT_DASHBOARD,
    requestedAt,
  }
}

function receiveStatDashboard(requestedAt, data) {
  return {
    type: RECEIVE_STAT_DASHBOARD,
    requestedAt,
    data,
  }
}

export function fetchStatDashboard() {
  return dispatch => {
    const requestedAt = `summary_${Date.now()}`
    dispatch(requestStatDashboard(requestedAt))

    return aspectFetch(`/dashboard/summary`, {
      errorNotifications: {
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
              id: 'errorResponseMessages.fetchStatDashboard.GET.default.title',
              defaultMessage: 'Error Loading Dashboard Stat',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveStatDashboard(requestedAt, json.data)))
  }
}

function requestTargetDashboard(requestedAt) {
  return {
    type: REQUEST_TARGET_DASHBOARD,
    requestedAt,
  }
}

function receiveTargetDashboard(requestedAt, data) {
  return {
    type: RECEIVE_TARGET_DASHBOARD,
    requestedAt,
    data,
  }
}

export function fetchTargetDashboard(filtersParams) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    const requestedAt = `target_${Date.now()}`
    dispatch(requestTargetDashboard(requestedAt))

    return aspectFetch(
      `/dashboard/target?${stringify({
        ...filters,
      })}`,
      {
        errorNotifications: {
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
                id:
                  'errorResponseMessages.fetchTargetDashboard.GET.default.title',
                defaultMessage: 'Error Loading Dashboard Target',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveTargetDashboard(requestedAt, json.data)))
  }
}

function requestResultDashboard(requestedAt) {
  return {
    type: REQUEST_RESULT_DASHBOARD,
    requestedAt,
  }
}

function receiveResultDashboard(requestedAt, data) {
  return {
    type: RECEIVE_RESULT_DASHBOARD,
    requestedAt,
    data,
  }
}

export function fetchResultDashboard() {
  return dispatch => {
    const requestedAt = `result_${Date.now()}`
    dispatch(requestResultDashboard(requestedAt))

    return aspectFetch('/dashboard/result', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchResultDashboard.GET.default.title',
              defaultMessage: 'Error Loading Result Dashboard',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveResultDashboard(requestedAt, json.data)))
  }
}

function requestInventoryItemDashboard(requestedAt) {
  return {
    type: REQUEST_INVENTORY_ITEM_DASHBOARD,
    requestedAt,
  }
}

function receiveInventoryItemDashboard(requestedAt, data) {
  return {
    type: RECEIVE_INVENTORY_ITEM_DASHBOARD,
    requestedAt,
    data,
  }
}

export function fetchInventoryItemDashboard() {
  return dispatch => {
    const requestedAt = `inventory_${Date.now()}`
    dispatch(requestInventoryItemDashboard(requestedAt))

    return aspectFetch('/dashboard/inventory-item', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchInventoryItemDashboard.GET.default.title',
              defaultMessage: 'Error Loading InventoryItem Dashboard',
            },
          })
        ),
      },
    }).then(json =>
      dispatch(receiveInventoryItemDashboard(requestedAt, json.data))
    )
  }
}

function requestDeviceDashboard(requestedAt) {
  return {
    type: REQUEST_DEVICE_DASHBOARD,
    requestedAt,
  }
}

function receiveDeviceDashboard(requestedAt, data) {
  return {
    type: RECEIVE_DEVICE_DASHBOARD,
    requestedAt,
    data,
  }
}

export function fetchDeviceDashboard() {
  return dispatch => {
    const requestedAt = `device_${Date.now()}`
    dispatch(requestDeviceDashboard(requestedAt))

    return aspectFetch('/dashboard/device', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchDeviceDashboard.GET.default.title',
              defaultMessage: 'Error Loading Dashboard Device',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveDeviceDashboard(requestedAt, json.data)))
  }
}

function requestSiteDashboard(requestedAt) {
  return {
    type: REQUEST_SITE_DASHBOARD,
    requestedAt,
  }
}

function receiveSiteDashboard(requestedAt, data) {
  return {
    type: RECEIVE_SITE_DASHBOARD,
    requestedAt,
    data,
  }
}

export function fetchSiteDashboard() {
  return dispatch => {
    const requestedAt = `site_${Date.now()}`
    dispatch(requestSiteDashboard(requestedAt))

    return aspectFetch('/dashboard/site', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSiteDashboard.GET.default.title',
              defaultMessage: 'Error Loading Dashboard Site',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSiteDashboard(requestedAt, json.data)))
  }
}

function requestOperationalStatus(requestedAt) {
  return {
    type: REQUEST_OPERATIONAL_STATUS,
    requestedAt,
  }
}

function receiveOperationalStatus(requestedAt, data) {
  return {
    type: RECEIVE_OPERATIONAL_STATUS,
    requestedAt,
    data,
  }
}

export function fetchOperationalStatus(filtersParams) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    const requestedAt = `operational_${Date.now()}`
    dispatch(requestOperationalStatus(requestedAt))

    return aspectFetch(
      `/dashboard/operational?${stringify({
        ...filters,
      })}`,
      {
        errorNotifications: {
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

function requestActionDashboard(requestedAt) {
  return {
    type: REQUEST_ACTION_STATUS,
    requestedAt,
  }
}

function receiveActionDashboard(requestedAt, data) {
  return {
    type: RECEIVE_ACTION_STATUS,
    requestedAt,
    data,
  }
}

export function fetchActionDashboard(rawFiltersParams, sortCol, sortDir) {
  const filtersParams = new URLSearchParams()
  if (rawFiltersParams.has('siteId')) {
    filtersParams.set('siteId', rawFiltersParams.get('siteId'))
  }
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    const requestedAt = `action_${Date.now()}`
    dispatch(requestActionDashboard(requestedAt))

    return aspectFetch(
      `/dashboard/action?${stringify({
        sortCol,
        sortDir,
        ...filters,
      })}`,
      {
        errorNotifications: {
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
                id:
                  'errorResponseMessages.receiveActionDashboard.GET.default.title',
                defaultMessage: 'Error Loading Action Data',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveActionDashboard(requestedAt, json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Summary = Immutable.Record({
  requestedAtSet: Immutable.Set(),
  summary: Immutable.List(),
  targetSummaryList: Immutable.List(),
  resultSiteList: Immutable.List(),
  resultSummaryList: Immutable.List(),
  inventoryItemSiteList: Immutable.List(),
  inventorySiteSummaryList: Immutable.List(),
  inventoryConsumableSummaryList: Immutable.List(),
  deviceList: Immutable.List(),
  deviceSummaryMap: Immutable.Map(),
  siteList: Immutable.List(),
  siteSummaryMap: Immutable.Map(),
  operational: Immutable.Map(),
  actionSummaryMap: Immutable.Map(),
})

const initialState = new Summary()

export default function dashboardReducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_STAT_DASHBOARD:
    case REQUEST_TARGET_DASHBOARD:
    case REQUEST_RESULT_DASHBOARD:
    case REQUEST_INVENTORY_ITEM_DASHBOARD:
    case REQUEST_DEVICE_DASHBOARD:
    case REQUEST_SITE_DASHBOARD:
    case REQUEST_OPERATIONAL_STATUS:
    case REQUEST_ACTION_STATUS:
      return state.set(
        'requestedAtSet',
        state.requestedAtSet.add(action.requestedAt)
      )
    case RECEIVE_STAT_DASHBOARD:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.set('summary', new Immutable.fromJS(action.data))
        }
      })
    case RECEIVE_TARGET_DASHBOARD:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.set('targetSummaryList', new Immutable.fromJS(action.data))
        }
      })
    case RECEIVE_RESULT_DASHBOARD:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.mergeDeepIn(['resultSiteList'], action.data.siteList)
          mutState.mergeDeepIn(
            ['resultSummaryList'],
            action.data.resultSummaryList
          )
        }
      })
    case RECEIVE_DEVICE_DASHBOARD:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.mergeDeepIn(['deviceList'], action.data.deviceList)
          mutState.mergeDeepIn(
            ['deviceSummaryMap'],
            action.data.deviceSummaryMap
          )
        }
      })
    case RECEIVE_SITE_DASHBOARD:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.mergeDeepIn(['siteList'], action.data.siteList)
          mutState.mergeDeepIn(['siteSummaryMap'], action.data.siteSummaryMap)
        }
      })
    case RECEIVE_INVENTORY_ITEM_DASHBOARD:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.mergeDeepIn(['inventoryItemSiteList'], action.data.siteList)
          mutState.mergeDeepIn(
            ['inventorySiteSummaryList'],
            action.data.inventorySiteSummaryList
          )
          mutState.mergeDeepIn(
            ['inventoryConsumableSummaryList'],
            action.data.inventoryConsumableSummaryList
          )
        }
      })
    case RECEIVE_OPERATIONAL_STATUS:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.mergeDeepIn(['operational'], action.data)
        }
      })
    case RECEIVE_ACTION_STATUS:
      return state.withMutations(mutState => {
        if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
          mutState.set(
            'requestedAtSet',
            mutState.requestedAtSet.delete(action.requestedAt)
          )
          mutState.set('actionSummaryMap', new Immutable.fromJS(action.data))
        }
      })
    default:
      return state
  }
}
