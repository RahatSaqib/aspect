import { stringify } from 'querystring'
import pick from 'lodash/pick'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  inlineWarning,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../error/CommonErrorNotifications'
import { receivedExportResponse } from '../globals/GlobalsRedux'
import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../shared/metaReducers/table'
import { getFilters } from '../filter/utils'

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

const contactDetailsFields = [
  'name',
  'title',
  'email',
  'email2',
  'phone',
  'cell',
  'countryId',
  'stateId',
  'lgaId',
  'zip',
  'notes',
  'lastPartnerId',
  'canLogIn',
]
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

function transformToUser(canLogIn, personId) {
  return {
    type: types.CAN_LOG_IN_PERSON,
    canLogIn,
    personId,
  }
}

function rejectPersons() {
  return {
    type: types.REJECTED_PERSONS,
  }
}
export function personCanLogIn(canLogIn, personId) {
  return dispatch => {
    dispatch(transformToUser(canLogIn, personId))
  }
}
export function emailValueBlur(value, personId) {
  return dispatch => {
    dispatch(prefillEmailValue(value, personId))
  }
}
function prefillEmailValue(email, personId) {
  return {
    type: types.PREFILL_EMAIL,
    email,
    personId,
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

function requestSiteContacts(siteId) {
  return {
    type: types.REQUEST_SITE_CONTACTS,
    siteId,
  }
}

// receive possible contacts
function receiveSiteContacts(siteId, items) {
  return {
    type: types.RECEIVE_SITE_CONTACTS,
    items,
    siteId,
  }
}

export function fetchSiteContacts(siteId) {
  return dispatch => {
    dispatch(requestSiteContacts(siteId))
    return aspectFetch(`/person?siteId=${siteId}`, {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchASiteContacts.GET.400.title',
              defaultMessage: 'Invalid Site ID',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSiteContacts(siteId, json.data)))
  }
}
// loading a single person with given personId
function requestSinglePerson(personId) {
  return {
    type: types.REQUEST_SINGLE_PERSON,
    personId,
  }
}

// received a single person
function receiveSinglePerson(item) {
  return {
    type: types.RECEIVE_SINGLE_PERSON,
    item,
  }
}

// load a single person with given personId
export function fetchSinglePerson(personId, cb) {
  return dispatch => {
    dispatch(requestSinglePerson(personId))

    return aspectFetch(`/person/${personId}`, {
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSinglePerson.GET.404.title',
              defaultMessage: "Could Not Find Contact's Details",
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSinglePerson.GET.default.title',
              defaultMessage: "Error Loading Contact's Details",
            },
          })
        ),
      },
    }).then(json => {
      dispatch(receiveSinglePerson(json.data))
      if (cb) cb()
    })
  }
}

// creating a single person with given data
function requestCreatingSinglePerson(data) {
  return {
    type: types.REQUEST_CREATING_SINGLE_PERSON,
    data,
  }
}

// received a created single person
function receiveCreatedSinglePerson(item) {
  return {
    type: types.RECEIVE_CREATED_SINGLE_PERSON,
    item,
  }
}

// create a single person with given data
export function createPerson(data) {
  return dispatch => {
    dispatch(requestCreatingSinglePerson(data))

    const personJson = data.toJS ? data.toJS() : data
    return aspectFetch('/person', {
      method: 'POST',
      body: JSON.stringify(pick(personJson, contactDetailsFields)),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.createPerson.POST.default.title',
              defaultMessage: 'An Error Occurred When Trying to Create the Contact',
            },
          })
        ),
      },
    }).then(json => {
      dispatch(receiveCreatedSinglePerson(json.data))
      return json.data
    })
  }
}

// updating a single person with given personId and data
function requestUpdatingSinglePerson(personId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_PERSON,
    personId,
    data,
  }
}

// received a updated single person
function receiveUpdatedSinglePerson(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_PERSON,
    item,
  }
}

function receiveUpdatedSinglePersonLoadinDetails(updatedInformation) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_PERSON_LOGIN_DETAILS,
    ...updatedInformation,
  }
}

// update a single person with given personId and data
function updatePerson(path, personId, data, fields) {
  return dispatch => {
    dispatch(requestUpdatingSinglePerson(personId, data))

    const personJson = data.toJS ? data.toJS() : data
    return aspectFetch(path, {
      method: 'PUT',
      body: JSON.stringify(pick(personJson, fields)),
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updatePerson.PUT.404.title',
              defaultMessage: "Could Not Find Contact's Details",
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updatePerson.PUT.default.title',
              defaultMessage: 'An Error Occurred When Trying to Save the Contact',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSinglePerson(json.data)))
  }
}

export function updateSinglePerson(personId, data) {
  return updatePerson(`/person/${personId}`, personId, data, contactDetailsFields)
}

export function updateSinglePersonLoginDetails(personId, data) {
  return dispatch => {
    dispatch(requestUpdatingSinglePerson(personId, data))

    const loginDetailsJson = data.toJS ? data.toJS() : data
    return aspectFetch(`/auth/update-person-login-details/${personId}`, {
      method: 'PUT',
      body: JSON.stringify(pick(loginDetailsJson, ['newUsername', 'newPassword', 'userLockedOut'])),
      errorNotifications: {
        409: inlineWarning(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSinglePersonLoginDetails.PUT.409.title',
              defaultMessage: 'This Username is Unavailable',
            },
            message: {
              id: 'errorResponseMessages.updateSinglePersonLoginDetails.PUT.409.message',
              defaultMessage: 'The username that you have entered is already in use by another user on the system',
            },
            resolution: {
              id: 'errorResponseMessages.updateSinglePersonLoginDetails.PUT.409.resolution',
              defaultMessage: 'Please try another username',
            },
          })
        ),
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSinglePersonLoginDetails.PUT.404.title',
              defaultMessage: "Could Not Find User's Details",
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSinglePersonLoginDetails.PUT.default.title',
              defaultMessage: 'Saving Login Details Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSinglePersonLoadinDetails(json.data)))
  }
}

export function updateSinglePersonUserPreferences(personId, data) {
  return updatePerson(`/person/preferences/${personId}`, personId, data, ['timezone', 'culture'])
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

export function fetchPersonAssignments(personId) {
  return dispatch => {
    dispatch(requestPersonAssignments(personId))
    return aspectFetch(`/job-function/person-assignments/${personId}`, {
      errorNotifications: {
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPersonAssignments.GET.404.title',
              defaultMessage: 'Not Found',
            },
          })
        ),
      },
    }).then(json => dispatch(receivePersonAssignments(personId, json.data)))
  }
}
export function addPersonAssignment(data) {
  return dispatch => {
    const { personId } = data
    dispatch(requestPersonAssignments(personId))
    return aspectFetch(`/job-function/assign-person-to-job-and-context`, {
      method: 'POST',
      body: JSON.stringify(data),
      errorNotifications: {
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.addPersonAssignment.POST.404.title',
              defaultMessage: 'Not Found',
            },
          })
        ),
      },
    }).then(json => dispatch(receivePersonAssignments(personId, json.data)))
  }
}
export function deletePersonAssignment(data) {
  return dispatch => {
    const { personId, jobContextId } = data
    dispatch({
      type: types.REQUEST_DELETE_ASSIGNMENT,
      personId,
      jobContextId,
    })
    return aspectFetch(`/job-function/person-assignment/${personId}/${jobContextId}`, {
      method: 'DELETE',
      errorNotifications: {
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.deletePersonAssignment.DELETE.404.title',
              defaultMessage: 'Not Found',
            },
          })
        ),
      },
    }).then(json =>
      dispatch({
        type: types.RECEIVE_DELETE_ASSIGNMENT,
        personId,
        jobContextId,
        items: json.data,
      })
    )
  }
}
function requestPersonAssignments(personId) {
  return {
    type: types.REQUEST_ASSIGNMENTS,
    personId,
  }
}

function receivePersonAssignments(personId, items) {
  return {
    type: types.RECEIVE_ASSIGNMENTS,
    personId,
    items,
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
