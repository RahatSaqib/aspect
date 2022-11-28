import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { getFilters } from '../oldComponents/filter/utils'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'
import { receiveList, receiveItem, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'
import { receivedExportResponse } from './GlobalsRedux'

export const types = {
  REQUEST_PERSONS: 'REQUEST_PERSONS',
  CAN_LOG_IN_PERSON: 'CAN_LOG_IN_PERSON',
  RECEIVE_PERSONS: 'RECEIVE_PERSONS',
  REJECTED_PERSONS: 'REJECTED_PERSONS',

  PREFILL_EMAIL: 'PREFILL_EMAIL',

  RECEIVE_AVAILABLE_PERSONS: 'RECEIVE_AVAILABLE_PERSONS',
  REQUEST_AVAILABLE_PERSONS: 'REQUEST_AVAILABLE_PERSONS',

  REQUEST_SITE_CONTACTS: 'REQUEST_SITE_CONTACTS',
  RECEIVE_SITE_CONTACTS: 'RECEIVE_SITE_CONTACTS',

  REQUEST_SINGLE_PERSON: 'REQUEST_SINGLE_PERSON',
  RECEIVE_SINGLE_PERSON: 'RECEIVE_SINGLE_PERSON',

  REQUEST_CREATING_SINGLE_PERSON: 'REQUEST_CREATING_SINGLE_PERSON',
  RECEIVE_CREATED_SINGLE_PERSON: 'RECEIVE_CREATED_SINGLE_PERSON',

  REQUEST_UPDATING_SINGLE_PERSON: 'REQUEST_UPDATING_SINGLE_PERSON',
  RECEIVE_UPDATED_SINGLE_PERSON: 'RECEIVE_UPDATED_SINGLE_PERSON',
  RECEIVE_UPDATED_SINGLE_PERSON_LOGIN_DETAILS: 'RECEIVE_UPDATED_SINGLE_PERSON_LOGIN_DETAILS',

  REQUEST_UPDATE_SITE_CONTACTS: 'REQUEST_UPDATE_SITE_CONTACTS',
  RECEIVE_UPDATE_SITE_CONTACTS: 'RECEIVE_UPDATE_SITE_CONTACTS',

  REQUEST_ASSIGNMENTS: 'REQUEST_ASSIGNMENTS',
  RECEIVE_ASSIGNMENTS: 'RECEIVE_ASSIGNMENTS',
  REQUEST_DELETE_ASSIGNMENT: 'REQUEST_DELETE_ASSIGNMENT',
  RECEIVE_DELETE_ASSIGNMENT: 'RECEIVE_DELETE_ASSIGNMENT',
}

/*
 * ---------------- Action Creators -----------------
 */

function requestPersons(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_PERSONS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receivePersons(json) {
  return {
    type: types.RECEIVE_PERSONS,
    items: json.data,
    total: json.total,
  }
}

function rejectPersons() {
  return {
    type: types.REJECTED_PERSONS,
  }
}

export function fetchPersons(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = getFilters(filtersParams)
    dispatch(requestPersons(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/person?${stringify({
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
                id: 'errorResponseMessages.fetchPersons.GET.400.title',
                defaultMessage: 'Searching Contacts Failed',
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
                id: 'errorResponseMessages.fetchPersons.GET.default.title',
                defaultMessage: 'Loading Contacts Failed',
              },
            })
          ),
        },
      }
    )
      .then(json => dispatch(receivePersons(json)))
      .catch(() => dispatch(rejectPersons()))
  }
}

function requestAvailablePersons() {
  return {
    type: types.REQUEST_AVAILABLE_PERSONS,
  }
}

// receive possible contacts
function receiveAvailablePersons(items) {
  return {
    type: types.RECEIVE_AVAILABLE_PERSONS,
    items,
  }
}

export function exportContacts(filtersParams, sortCol, sortDir, page, pageSize, fileFormat, reportName) {
  return dispatch => {
    const filters = getFilters(filtersParams)

    return aspectFetch(
      `/person/export?${stringify({
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
                id: 'errorResponseMessages.exportContacts.GET.400.title',
                defaultMessage: 'Exporting Contacts Failed',
              },
            })
          ),
          403: errorForbidden(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportContacts.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportContacts.GET.default.title',
                defaultMessage: 'Exporting Contacts Failed',
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

export function fetchAvailablePersons() {
  return dispatch => {
    dispatch(requestAvailablePersons())
    return aspectFetch('/person/available', {
      errorNotifications: {
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchAvailablePersons.GET.403.title',
              defaultMessage: 'Insufficient Permissions',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveAvailablePersons(json.data)))
  }
}

function requestUpdateSiteContacts() {
  return {
    type: types.REQUEST_UPDATE_SITE_CONTACTS,
  }
}

function receiveUpdateSiteContacts(siteId, items) {
  return {
    type: types.RECEIVE_UPDATE_SITE_CONTACTS,
    siteId,
    items,
  }
}

// (un)assign person with given person to site with siteId
export function fetchUpdateSiteContacts(siteId, person, operation) {
  const path = operation === 'delete' ? 'unassign' : 'assign'
  return dispatch => {
    dispatch(requestUpdateSiteContacts())
    return aspectFetch(`/person/${path}/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(person),
      errorNotifications: {
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchUpdateSiteContacts.PUT.404.title',
              defaultMessage: 'Not Found',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdateSiteContacts(siteId, json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Person = Immutable.Record({
  items: new Items(),
  table: new Table(),
  availableContacts: Immutable.Map(),
  siteContacts: Immutable.Map(),
  personNew: Immutable.Map(),
})

const ContactTagItems = Immutable.Record({
  loading: false,
  items: Immutable.List(),
  lastRefreshed: undefined,
})

export const ContactDetails = Immutable.Record({
  id: null,
  name: null,
  title: null,
  email: null,
  email2: null,
  phone: null,
  cell: null,
  countryId: null,
  stateId: null,
  lgaId: null,
  zip: null,
  notes: null,
  lastPartnerId: null,
  canLogIn: false,
})
export const LoginDetails = Immutable.Record({
  id: null,
  username: null,
  newPassword: null,
  confirmNewPassword: null,
  currentPassword: null,
  partnerId: null,
  jobFunctions: Immutable.List([]),
  userLockedOut: null,
  email: null,
})
export const UserPreferences = Immutable.Record({
  id: null,
  timezone: null,
  culture: null,
})

const initialState = new Person()

function requestAvailableContacts(state) {
  const people = state.getIn(['availableContacts', 'person'])
  if (people) {
    state.setIn(['availableContacts', 'person', 'loading'], true)
  }
  return state
}

export default function personReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_PERSONS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_PERSONS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.REJECTED_PERSONS:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    case types.CAN_LOG_IN_PERSON:
      return state.setIn(['items', 'byId', action.personId, 'canLogIn'], action.canLogIn)
    case types.REQUEST_AVAILABLE_PERSONS:
      return requestAvailableContacts(state)
    case types.RECEIVE_AVAILABLE_PERSONS:
      return state.setIn(
        ['availableContacts', 'person'],
        new ContactTagItems({
          loading: false,
          lastRefreshed: action.lastRefreshed,
          items: Immutable.fromJS(action.items),
        })
      )
    case types.RECEIVE_UPDATE_SITE_CONTACTS:
    case types.RECEIVE_SITE_CONTACTS:
      return state.setIn(['siteContacts', action.siteId], Immutable.fromJS(action.items))
    case types.RECEIVE_SINGLE_PERSON:
    case types.RECEIVE_UPDATED_SINGLE_PERSON:
    case types.RECEIVE_CREATED_SINGLE_PERSON:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS({ ...action.item, loaded: true })
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.PREFILL_EMAIL:
      return state.setIn(['items', 'byId', action.personId, 'email'], action.email)
    case types.RECEIVE_UPDATED_SINGLE_PERSON_LOGIN_DETAILS:
      return state.mergeIn(['items', 'byId', action.personId], {
        loaded: true,
        username: action.username,
        userLockedOut: action.userLockedOut,
        userId: action.userId,
      })
    case types.REQUEST_UPDATING_SINGLE_PERSON:
      return state.setIn(['items', 'byId', action.personId, 'loaded'], false)
    case types.REQUEST_CREATING_SINGLE_PERSON:
      return state.setIn(['personNew', 'loaded'], false)

    case types.REQUEST_ASSIGNMENTS:
    case types.REQUEST_DELETE_ASSIGNMENT:
      return state.withMutations(mutState => {
        mutState.mergeIn(['items', 'byId', action.personId], {
          loadedAssignments: false,
        })
      })
    case types.RECEIVE_ASSIGNMENTS:
    case types.RECEIVE_DELETE_ASSIGNMENT:
      return state.withMutations(mutState => {
        mutState.mergeIn(['items', 'byId', action.personId], {
          loadedAssignments: true,
          assignments: action.items,
        })
      })
    default:
      return state
  }
}
