import Immutable from 'immutable'
import { SubmissionError } from 'redux-form'
import _ from 'lodash'
import jwt_decode from 'jwt-decode'
import { aspectFetch, getHeaders, getBrowserNameAndVersion } from '../shared/utils/fetch'
import * as localStorage from '../shared/utils/localStorage'
import { addError } from '../error/ErrorRedux'
import {loginSuccess} from '../auth/AuthRedux'

export const types = {
  REQUEST_ACCOUNT_DETAILS: 'REQUEST_ACCOUNT_DETAILS',
  RECEIVE_ACCOUNT_DETAILS: 'RECEIVE_ACCOUNT_DETAILS',
  SAVE_ACCOUNT_DETAILS_START: 'SAVE_ACCOUNT_DETAILS_START',
  RECEIVE_UPDATED_CONTACT_DETAILS: 'RECEIVE_UPDATED_CONTACT_DETAILS',
  RECEIVE_UPDATED_LOGIN_DETAILS: 'RECEIVE_UPDATED_LOGIN_DETAILS',
  RECEIVE_UPDATED_USER_PREFERENCES: 'RECEIVE_UPDATED_USER_PREFERENCES',
  INCORRECT_CURRENT_PASSWORD_ENTERED: 'INCORRECT_CURRENT_PASSWORD_ENTERED'
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

function createIncorrectCurrentPasswordEntered() {
  return {
    type: types.INCORRECT_CURRENT_PASSWORD_ENTERED
  }
}

function storeAccess(access, refresh, clientId) {
  const jwt = jwt_decode(access)
  localStorage.store(access, jwt.exp, refresh, clientId)
  return jwt
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
      .then(json => {
        let jwt = storeAccess(json.access, json.refresh, json.clientId)
        dispatch(loginSuccess(jwt.name, jwt.culture, jwt.lang))
        dispatch(createReceiveUpdatedLoginDetails(json.data))
      })
      .catch(err => {
        if(err.message === 'Incorrect password.') {
          dispatch(createIncorrectCurrentPasswordEntered())
          //TODO: i18n Possibly through a callback passed to the function
          throw new SubmissionError({currentPassword: 'The password that you entered is not valid'})
        } else if(err.message === 'Username already in use') {
          //TODO: i18n Possibly through a callback passed to the function
          throw new SubmissionError({username: 'This username is unavailable'})
        } else {
          dispatch(addError('Saving login details failed', err.message, err))
        }
      })
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
    currentPassword: null,
    incorrectCurrentPasswordEntered: false
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
      loginDetails: new LoginDetails({...state.getIn(['data', 'loginDetails']).toJS(),
        username: updateDetails.username,
        incorrectCurrentPasswordEntered: false
      }),
      userPreferences: state.getIn(['data', 'userPreferences'])
    })
  })
}

function incorrectCurrentPasswordEntered(state) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: new LoginDetails({...state.getIn(['data', 'loginDetails']).toJS(),
        incorrectCurrentPasswordEntered: true
      }),
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
  case types.INCORRECT_CURRENT_PASSWORD_ENTERED:
    return incorrectCurrentPasswordEntered(state)
  }
  return state
}
