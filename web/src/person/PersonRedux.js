import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  inlineWarning,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../error/CommonErrorNotifications'
import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_PERSONS: 'REQUEST_PERSONS',
  CAN_LOG_IN_PERSON: 'CAN_LOG_IN_PERSON',
  RECEIVE_PERSONS: 'RECEIVE_PERSONS',
  REJECTED_PERSONS: 'REJECTED_PERSONS',
  PREFETCH_EMAIL: 'PREFETCH_EMAIL',
  REQUEST_SINGLE_PERSON: 'REQUEST_SINGLE_PERSON',
  RECEIVE_SINGLE_PERSON: 'RECEIVE_SINGLE_PERSON',

  REQUEST_UPDATING_SINGLE_PERSON: 'REQUEST_UPDATING_SINGLE_PERSON',
  RECEIVE_UPDATED_SINGLE_PERSON: 'RECEIVE_UPDATED_SINGLE_PERSON',
  RECEIVE_UPDATED_SINGLE_PERSON_LOGIN_DETAILS:
    'RECEIVE_UPDATED_SINGLE_PERSON_LOGIN_DETAILS',
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
export function emailValueChange(value) {
  return dispatch => {
    dispatch(() => ({
      type: types.PREFETCH_EMAIL,
      value,
    }))
  }
}
export function fetchPersons(filtersParams, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
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
export function fetchSinglePerson(personId) {
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
    }).then(json => dispatch(receiveSinglePerson(json.data)))
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
    personId: updatedInformation.personId,
    username: updatedInformation.username,
    userLockedOut: updatedInformation.userLockedOut,
  }
}

// update a single person with given personId and data
function updatePerson(path, personId, data, fields) {
  return dispatch => {
    dispatch(requestUpdatingSinglePerson(personId, data))

    const personJson = data.toJS ? data.toJS() : data
    return aspectFetch(path, {
      method: 'PUT',
      body: JSON.stringify(_.pick(personJson, fields)),
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
              defaultMessage:
                'An Error Occurred When Trying to Save the Contact',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSinglePerson(json.data)))
  }
}

export function updateSinglePerson(personId, data) {
  return updatePerson(`/person/${personId}`, personId, data, [
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
  ])
}

export function updateSinglePersonLoginDetails(personId, data) {
  return dispatch => {
    dispatch(requestUpdatingSinglePerson(personId, data))

    const loginDetailsJson = data.toJS ? data.toJS() : data
    return aspectFetch(`/auth/update-person-login-details/${personId}`, {
      method: 'PUT',
      body: JSON.stringify(
        _.pick(loginDetailsJson, [
          'newUsername',
          'newPassword',
          'userLockedOut',
        ])
      ),
      errorNotifications: {
        409: inlineWarning(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateSinglePersonLoginDetails.PUT.409.title',
              defaultMessage: 'This Username is Unavailable',
            },
            message: {
              id:
                'errorResponseMessages.updateSinglePersonLoginDetails.PUT.409.message',
              defaultMessage:
                'The username that you have entered is already in use by another user on the system',
            },
            resolution: {
              id:
                'errorResponseMessages.updateSinglePersonLoginDetails.PUT.409.resolution',
              defaultMessage: 'Please try another username',
            },
          })
        ),
        404: errorNotFound(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateSinglePersonLoginDetails.PUT.404.title',
              defaultMessage: "Could Not Find User's Details",
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateSinglePersonLoginDetails.PUT.default.title',
              defaultMessage: 'Saving Login Details Failed',
            },
          })
        ),
      },
    }).then(json =>
      dispatch(receiveUpdatedSinglePersonLoadinDetails(json.data))
    )
  }
}

export function updateSinglePersonUserPreferences(personId, data) {
  return updatePerson(`/person/preferences/${personId}`, personId, data, [
    'timezone',
    'culture',
  ])
}
/*
 * ---------------- Reducers -----------------
 */
const Person = Immutable.Record({
  items: new Items(),
  table: new Table(),
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
  jobFunctions: new Immutable.List([]),
  userLockedOut: null,
})
export const UserPreferences = Immutable.Record({
  id: null,
  timezone: null,
  culture: null,
})

const initialState = new Person()

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
      return state.withMutations(mutState => {
        const currentState = state.items.byId
          .get(action.personId)
          .set('canLogIn', action.canLogIn)
        mutState.set('items', receiveItem(mutState.items, currentState))
      })
    case types.RECEIVE_SINGLE_PERSON:
    case types.RECEIVE_UPDATED_SINGLE_PERSON:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS({ ...action.item, loaded: true })
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.RECEIVE_UPDATED_SINGLE_PERSON_LOGIN_DETAILS:
      return state.withMutations(mutState => {
        const person = state.items.byId.get(action.personId).merge({
          loaded: true,
          username: action.username,
          userLockedOut: action.userLockedOut,
        })
        mutState.set('items', receiveItem(mutState.items, person))
      })
    case types.REQUEST_UPDATING_SINGLE_PERSON:
      return state.withMutations(mutState => {
        const person = state.items.byId
          .get(action.personId)
          .set('loaded', false)
        mutState.set('items', receiveItem(mutState.items, person))
      })
    default:
      return state
  }
}
