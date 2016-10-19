import Immutable from 'immutable'
import _ from 'lodash'
import { aspectFetch, getHeaders, getBrowserNameAndVersion } from '../shared/utils/fetch'
import * as localStorage from '../shared/utils/localStorage'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_ACCOUNT_DETAILS: 'REQUEST_ACCOUNT_DETAILS',
  RECEIVE_ACCOUNT_DETAILS: 'RECEIVE_ACCOUNT_DETAILS',
  SAVE_ACCOUNT_DETAILS_START: 'SAVE_ACCOUNT_DETAILS_START',
  RECEIVE_UPDATED_CONTACT_DETAILS: 'RECEIVE_UPDATED_CONTACT_DETAILS',
  RECEIVE_UPDATED_LOGIN_DETAILS: 'RECEIVE_UPDATED_LOGIN_DETAILS',
  RECEIVE_UPDATED_USER_PREFERENCES: 'RECEIVE_UPDATED_USER_PREFERENCES'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestAccountDetails() {
  return {
    type: types.REQUEST_ACCOUNT_DETAILS
  }
}

function createReceiveAccountDetails(accountDetails) {
  return {
    type: types.RECEIVE_ACCOUNT_DETAILS,
    accountDetails
  }
}

export function fetchAccountDetails(){
  return dispatch => {
    dispatch(createRequestAccountDetails())
    return aspectFetch('/account-details/current')
      .then(json => dispatch(createReceiveAccountDetails(json.data)))
                                      //TODO: i18n these error messages
      .catch(err => dispatch(addError('Loading account details failed', err.message, err)))
  }
}

function createSaveAccountDetailsStart() {
  return {
    type: types.SAVE_ACCOUNT_DETAILS_START
  }
}

function createReceiveUpdatedContactDetails(accountDetails) {
  return {
    type: types.RECEIVE_UPDATED_CONTACT_DETAILS,
    accountDetails
  }
}

export function saveContactDetails(contactDetails) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart())
    return aspectFetch('/account-details/current-contact',
      {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(contactDetails)
      })
      .then(json => dispatch(createReceiveUpdatedContactDetails(json.data)))
      .catch(err => dispatch(addError('Saving contact details failed', err.message, err)))
  }
}

function createReceiveUpdatedLoginDetails(updateDetails) {
  return {
    type: types.RECEIVE_UPDATED_LOGIN_DETAILS,
    updateDetails
  }
}

export function saveLoginDetails(loginDetails) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart())
    return aspectFetch('/auth/update-login-details',
      {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({
          currentPassword: loginDetails.currentPassword,
          newUsername: loginDetails.username,
          newPassword: loginDetails.newPassword,
          clientId: localStorage.getClientId(),
          clientName: getBrowserNameAndVersion() + ' on ' + window.navigator.platform
        })
      })
      //TODO: Update token and user details
      .then(json => dispatch(createReceiveUpdatedLoginDetails(json.data)))
      .catch(err => dispatch(addError('Saving login details failed', err.message, err)))
  }
}

function createReceiveUpdatedUserPreferences(accountDetails) {
  return {
    type: types.RECEIVE_UPDATED_USER_PREFERENCES,
    accountDetails
  }
}

export function saveUserPreferences(userPreferences) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart())
    return aspectFetch('/account-details/current-preferences',
      {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(userPreferences)
      })
      //TODO: Update language and time
      .then(json => dispatch(createReceiveUpdatedUserPreferences(json.data))) //TODO: Dispatch action to set current timezone and language
      .catch(err => dispatch(addError('Saving user preferences failed', err.message, err)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const ContactDetails = Immutable.Record({
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
    zip: null
  }), LoginDetails = Immutable.Record({
    id: null,
    username: null,
    newPassword: null,
    confirmNewPassword: null,
    currentPassword: null
  }), UserPreferences = Immutable.Record({
    id: null,
    timezone: null,
    culture: null
  }), AccountDetailsData = Immutable.Record({
    contactDetails: new ContactDetails(),
    loginDetails: new LoginDetails(),
    userPreferences: new UserPreferences()
  }), AccountDetails = Immutable.Record({
    loading: false,
    saving: false,
    data: new AccountDetailsData()
  })

const initialState = new AccountDetails()

function requestAccountDetails(state) {
  return state.merge({
    loading: true
  })
}

function receiveAccountDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: new ContactDetails(_.pick(accountDetailsData, Object.keys(state.getIn(['data', 'contactDetails']).toJS()))),
      loginDetails: new LoginDetails({ id: accountDetailsData.userId, username: accountDetailsData.username }),
      userPreferences: new UserPreferences(_.pick(accountDetailsData, Object.keys(state.getIn(['data', 'userPreferences']).toJS())))
    })
  })
}

function saveAccountDetailsStart(state) {
  return state.merge({
    saving: true
  })
}

function receiveUpdatedContactDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: new ContactDetails(_.pick(accountDetailsData, Object.keys(state.getIn(['data', 'contactDetails']).toJS()))),
      loginDetails: state.getIn(['data', 'loginDetails']),
      userPreferences: state.getIn(['data', 'userPreferences'])
    })
  })
}

function receiveUpdatedLoginDetails(state, updateDetails) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: new LoginDetails({ id: state.getIn(['data', 'loginDetails', 'id']), username: updateDetails.username }),
      userPreferences: state.getIn(['data', 'userPreferences'])
    })
  })
}

function receiveUpdatedUserPreferences(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: state.getIn(['data', 'loginDetails']),
      userPreferences: new UserPreferences(_.pick(accountDetailsData, Object.keys(state.getIn(['data', 'userPreferences']).toJS())))
    })
  })
}

export default function accountDetailsReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_ACCOUNT_DETAILS:
    return requestAccountDetails(state)
  case types.RECEIVE_ACCOUNT_DETAILS:
    return receiveAccountDetails(state, action.accountDetails)
  case types.SAVE_ACCOUNT_DETAILS_START:
    return saveAccountDetailsStart(state)
  case types.RECEIVE_UPDATED_CONTACT_DETAILS:
    return receiveUpdatedContactDetails(state, action.accountDetails)
  case types.RECEIVE_UPDATED_LOGIN_DETAILS:
    return receiveUpdatedLoginDetails(state, action.updateDetails)
  case types.RECEIVE_UPDATED_USER_PREFERENCES:
    return receiveUpdatedUserPreferences(state, action.accountDetails)
  }
  return state
}
