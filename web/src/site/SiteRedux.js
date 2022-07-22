import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import { formValueSelector, change as changeForm } from 'redux-form/immutable'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../error/CommonErrorNotifications'
import { receivedExportResponse } from '../globals/GlobalsRedux'
import { receiveItem, Items, receiveListWithSet } from '../shared/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../shared/metaReducers/table'
import { getLatLongFromAddress, convertToFloat } from './utils/address'
import { getFilters } from '../filter/utils'

export const types = {
  REQUEST_SITES: 'REQUEST_SITES',
  RECEIVE_SITES: 'RECEIVE_SITES',
  REJECTED_SITES: 'REJECTED_SITES',

  REQUEST_SINGLE_SITE: 'REQUEST_SINGLE_SITE',
  RECEIVE_SINGLE_SITE: 'RECEIVE_SINGLE_SITE',

  REQUEST_UPDATING_SINGLE_SITE: 'REQUEST_UPDATING_SINGLE_SITE',
  RECEIVE_UPDATED_SINGLE_SITE: 'RECEIVE_UPDATED_SINGLE_SITE',

  REQUEST_SITES_FOR_SELECT_LIST: 'REQUEST_SITES_FOR_SELECT_LIST',
  RECEIVE_SITES_FOR_SELECT_LIST: 'RECEIVE_SITES_FOR_SELECT_LIST',

  REQUEST_DELETING_SINGLE_SITE: 'REQUEST_DELETING_SINGLE_SITE',
  RECEIVE_DELETED_SINGLE_SITE: 'RECEIVE_DELETED_SINGLE_SITE',
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

function rejectSites() {
  return {
    type: types.REJECTED_SITES,
  }
}

export function fetchSites(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = getFilters(filtersParams)
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
          403: errorForbidden(
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
                id: 'errorResponseMessages.fetchSites.GET.default.title',
                defaultMessage: 'Loading Sites Failed',
              },
            })
          ),
        },
      }
    )
      .then(json => dispatch(receiveSites(json)))
      .catch(() => dispatch(rejectSites()))
  }
}
export function exportSites(filtersParams, sortCol, sortDir, page, pageSize, fileFormat, reportName) {
  return dispatch => {
    const filters = getFilters(filtersParams)

    return aspectFetch(
      `/site/export?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        format: fileFormat,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportSites.GET.400.title',
                defaultMessage: 'Exporting Sites Failed',
              },
            })
          ),
          403: errorForbidden(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportSites.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportSites.GET.default.title',
                defaultMessage: 'Exporting Sites Failed',
              },
            })
          ),
        },
      }
    ).then(async elem => {
      const file = await elem.blob
      dispatch(receivedExportResponse(file, fileFormat, reportName))
    })
  }
}

function requestSitesForSelectList() {
  return {
    type: types.REQUEST_SITES_FOR_SELECT_LIST,
  }
}

function receiveSitesForSelectList(json) {
  return {
    type: types.RECEIVE_SITES_FOR_SELECT_LIST,
    items: json.data,
    countryName: json.countryName,
    stateName: json.stateName,
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
      differenceInMinutes(new Date(), site.getIn(['sitesForSelectList', 'lastRefreshed'])) > 5 // five minutes
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
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPersons.GET.403.title',
              defaultMessage: 'Insufficient Permissions',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSitesForSelectList(json)))
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
    }).then(json => {
      dispatch(receiveUpdatedSingleSite(json.data))
      return json.data
    })
  }
}

export function updateSingleSiteFromForm(siteId) {
  const formName = 'siteDetail'

  return (dispatch, getState) => {
    const state = getState()
    const formData = state.getIn(['form', formName, 'values'])
    const submitData = {
      // Map form fields to API fields
      name: formData.get('name'),
      shortName: formData.get('shortName'),
      externalId: formData.get('externalId'),
      timezone: formData.get('timezone'),
      countryId: formData.get('countryId'),
      stateId: formData.get('stateId'),
      lgaId: formData.get('lgaId'),
      street1: formData.get('address'),
      street2: formData.get('address2'),
      city: formData.get('city'),
      zip: formData.get('zip'),
      longitude: formData.get('longitude'),
      latitude: formData.get('latitude'),
    }
    return dispatch(updateSingleSite(siteId, submitData)).then(data => {
      dispatch(changeForm(formName, 'latitude', data.latitude))
      dispatch(changeForm(formName, 'longitude', data.longitude))
    })
  }
}

export function updateLatLongFromFormAddress() {
  const formName = 'siteDetail'
  const formSelector = formValueSelector(formName)
  const formAddressSelector = state => formSelector(state, 'country', 'state', 'lga', 'city', 'address', 'address2')

  return (dispatch, getState) => {
    const formAddress = formAddressSelector(getState())
    return getLatLongFromAddress(formAddress).then(({ lat, lng }) => {
      dispatch(changeForm(formName, 'latitude', convertToFloat(lat, 6)))
      dispatch(changeForm(formName, 'longitude', convertToFloat(lng, 6)))
    })
  }
}

function requestDeletingSingleSite(requestedAt, siteId, data) {
  return {
    type: types.REQUEST_DELETING_SINGLE_SITE,
    requestedAt,
    siteId,
    data,
  }
}

function receiveDeletedSingleSite(requestedAt, item) {
  return {
    type: types.RECEIVE_DELETED_SINGLE_SITE,
    requestedAt,
    item,
  }
}

export function deleteSingleSite(siteId, data) {
  return dispatch => {
    dispatch(requestDeletingSingleSite(new Date(), siteId, data))
    return aspectFetch(`/site/disable/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify({ siteId }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.deleteSingleSite.DELETE.default.title',
              defaultMessage: 'An Error Occurred When Trying to Delete the Site',
            },
          })
        ),
      },
    }).then(json =>
      dispatch(
        receiveDeletedSingleSite(new Date(), {
          ...json.data,
          id: siteId,
        })
      )
    )
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const SelectListItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  countryName: undefined,
  stateName: undefined,
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

        mutState.set('items', receiveListWithSet(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.REJECTED_SITES:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    case types.RECEIVE_SINGLE_SITE:
    case types.RECEIVE_UPDATED_SINGLE_SITE:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', mutState.items.setIn(['byId', immutItem.get('id')], immutItem))
      })
    case types.RECEIVE_ASSIGN_PERSON:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.itemd)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.REQUEST_SITES_FOR_SELECT_LIST:
      return state.setIn(['selectList', 'loading'], true)
    case types.RECEIVE_SITES_FOR_SELECT_LIST:
      return state.mergeIn(['selectList'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: Immutable.fromJS(action.items),
        countryName: action.countryName,
        stateName: action.stateName,
      })
    default:
      return state
  }
}
