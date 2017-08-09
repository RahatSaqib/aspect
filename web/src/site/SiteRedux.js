import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import differenceInMinutes from 'date-fns/differenceInMinutes'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
} from '../error/CommonErrorNotifications'

import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_SITES: 'REQUEST_SITES',
  RECEIVE_SITES: 'RECEIVE_SITES',

  REQUEST_SINGLE_SITE: 'REQUEST_SINGLE_SITE',
  RECEIVE_SINGLE_SITE: 'RECEIVE_SINGLE_SITE',

  REQUEST_UPDATING_SINGLE_SITE: 'REQUEST_UPDATING_SINGLE_SITE',
  RECEIVE_UPDATED_SINGLE_SITE: 'RECEIVE_UPDATED_SINGLE_SITE',

  REQUEST_SITES_FOR_SELECT_LIST: 'REQUEST_SITES_FOR_SELECT_LIST',
  RECEIVE_SITES_FOR_SELECT_LIST: 'RECEIVE_SITES_FOR_SELECT_LIST',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestSites(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_SITES,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveSites(json) {
  return {
    type: types.RECEIVE_SITES,
    items: json.data,
    total: json.total,
  }
}

export function fetchSites(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    dispatch(requestSites(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/site?${stringify({
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
                id: 'errorResponseMessages.fetchSites.GET.400.title',
                defaultMessage: 'Searching Sites Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchSites.GET.default.title',
                defaultMessage: 'Loading Sites Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveSites(json)))
  }
}

function requestSitesForSelectList() {
  return {
    type: types.REQUEST_SITES_FOR_SELECT_LIST,
  }
}

function receiveSitesForSelectList(sitesForSelectList) {
  return {
    type: types.RECEIVE_SITES_FOR_SELECT_LIST,
    items: sitesForSelectList,
    lastRefreshed: new Date(),
  }
}

export function fetchSitesForSelectList(forceRefresh) {
  return (dispatch, getState) => {
    const { site } = getState()

    if (site.getIn(['sitesForSelectList', 'loading'])) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !site.getIn(['sitesForSelectList', 'lastRefreshed']) ||
      differenceInMinutes(
        new Date(),
        site.getIn(['sitesForSelectList', 'lastRefreshed'])
      ) > 5 // five minutes
    if (!shouldFetch) {
      return
    }

    dispatch(requestSitesForSelectList())
    return aspectFetch('/site/select-list', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSites.GET.default.title',
              defaultMessage: 'Loading Sites Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSitesForSelectList(json.data)))
  }
}

// loading a single site with given siteId
function requestSingleSite(siteId) {
  return {
    type: types.REQUEST_SINGLE_SITE,
    siteId,
  }
}

// received a single site
function receiveSingleSite(item) {
  return {
    type: types.RECEIVE_SINGLE_SITE,
    item,
  }
}

// load a single site with given siteId
export function fetchSingleSite(siteId) {
  return dispatch => {
    dispatch(requestSingleSite(siteId))

    return aspectFetch(`/site/${siteId}`, {
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleSite.GET.404.title',
              defaultMessage: 'Could Not Find Site Details',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleSite.GET.default.title',
              defaultMessage: 'Error Loading Site Details',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSingleSite(json.data)))
  }
}

// updating a single site with given siteId and data
function requestUpdatingSingleSite(siteId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_SITE,
    siteId,
    data,
  }
}

// received a updated single site
function receiveUpdatedSingleSite(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_SITE,
    item,
  }
}

// update a single site with given siteId and data
export function updateSingleSite(siteId, data) {
  return dispatch => {
    dispatch(requestUpdatingSingleSite(siteId, data))

    return aspectFetch(`/site/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSingleSite.PUT.default.title',
              defaultMessage: 'An Error Occurred When Trying to Save the Site',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleSite(json.data)))
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
export const Site = Immutable.Record({
  items: new Items(),
  table: new Table(),
  selectList: new SelectListItems(),
})

const initialState = new Site()

export default function siteReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_SITES:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_SITES:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.RECEIVE_SINGLE_SITE:
    case types.RECEIVE_UPDATED_SINGLE_SITE:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.REQUEST_SITES_FOR_SELECT_LIST:
      return state.setIn(['selectList', 'loading'], true)
    case types.RECEIVE_SITES_FOR_SELECT_LIST:
      return state.mergeIn(['selectList'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: new Immutable.fromJS(action.items),
      })
    default:
      return state
  }
}
