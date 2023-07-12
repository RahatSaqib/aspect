import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { getFilters } from '../oldComponents/utils'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'
import { receiveList, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_PERSONS: 'REQUEST_PERSONS',
  RECEIVE_PERSONS: 'RECEIVE_PERSONS',
  REJECTED_PERSONS: 'REJECTED_PERSONS',
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
    default:
      return state
  }
}
