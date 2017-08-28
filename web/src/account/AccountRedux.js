import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import _ from 'lodash'
import { SubmissionError } from 'redux-form/immutable'
import { getClientName } from '../shared/utils/browser'
import { aspectFetch, getHeaders } from '../shared/utils/fetch'
import {
  ContactDetails,
  LoginDetails,
  UserPreferences,
} from '../person/PersonRedux'
import {
  errorPleaseTryAgainInAFewMinutes,
  inlineWarning,
} from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_ACCOUNT_DETAILS: 'REQUEST_ACCOUNT_DETAILS',
  RECEIVE_ACCOUNT_DETAILS: 'RECEIVE_ACCOUNT_DETAILS',

  SAVE_ACCOUNT_DETAILS_START: 'SAVE_ACCOUNT_DETAILS_START',

  RECEIVE_UPDATED_CONTACT_DETAILS: 'RECEIVE_UPDATED_CONTACT_DETAILS',
  RECEIVE_UPDATED_LOGIN_DETAILS: 'RECEIVE_UPDATED_LOGIN_DETAILS',
  RECEIVE_UPDATED_USER_PREFERENCES: 'RECEIVE_UPDATED_USER_PREFERENCES',
  RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR:
    'RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR',
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestAccountDetails() {
  return {
    type: types.REQUEST_ACCOUNT_DETAILS,
  }
}

function createReceiveAccountDetails(accountDetails) {
  return {
    type: types.RECEIVE_ACCOUNT_DETAILS,
    accountDetails,
  }
}

export function fetchAccountDetails() {
  return dispatch => {
    dispatch(createRequestAccountDetails())
    return aspectFetch('/account-details/current', {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchAccountDetails.GET.default.title',
              defaultMessage: 'Loading Account Details Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveAccountDetails(json.data)))
  }
}

function createSaveAccountDetailsStart() {
  return {
    type: types.SAVE_ACCOUNT_DETAILS_START,
  }
}

function createReceiveUpdatedContactDetails(accountDetails) {
  return {
    type: types.RECEIVE_UPDATED_CONTACT_DETAILS,
    accountDetails,
  }
}

export function saveContactDetails(contactDetails) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart())

    return aspectFetch('/account-details/current-contact', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(contactDetails),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.saveContactDetails.PUT.default.title',
              defaultMessage: 'Saving Contact Details Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveUpdatedContactDetails(json.data)))
  }
}

function createReceiveUpdatedLoginDetails(updateDetails, data) {
  return {
    type: types.RECEIVE_UPDATED_LOGIN_DETAILS,
    data,
    updateDetails,
  }
}

function createReceiveUpdatedLoginDetailsExpectedError() {
  return {
    type: types.RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR,
  }
}

export function saveLoginDetails(loginDetails) {
  return (dispatch, getState) => {
    dispatch(createSaveAccountDetailsStart())
    const state = getState()
    const clientId = state.user.clientId

    return aspectFetch('/auth/update-login-details', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({
        currentPassword: loginDetails.currentPassword,
        newUsername: loginDetails.username,
        newPassword: loginDetails.newPassword,
        clientId,
        clientName: getClientName(),
      }),
      errorNotifications: {
        409: inlineWarning(
          defineMessages({
            title: {
              id: 'errorResponseMessages.saveLoginDetails.PUT.409.title',
              defaultMessage: 'This Username is Unavailable',
            },
            message: {
              id: 'errorResponseMessages.saveLoginDetails.PUT.409.message',
              defaultMessage:
                'The username that you have entered is already in use by another user on the system',
            },
            resolution: {
              id: 'errorResponseMessages.saveLoginDetails.PUT.409.resolution',
              defaultMessage: 'Please try another username',
            },
          })
        ),
        403: inlineWarning(
          defineMessages({
            title: {
              id: 'errorResponseMessages.saveLoginDetails.PUT.403.title',
              defaultMessage: 'Invalid Password',
            },
            message: {
              id: 'errorResponseMessages.saveLoginDetails.PUT.403.message',
              defaultMessage:
                'The current password that you have entered is incorrect.',
            },
            resolution: {
              id: 'errorResponseMessages.saveLoginDetails.PUT.403.resolution',
              defaultMessage:
                'Please try re-entering your password or contact us to reset your login details',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.saveLoginDetails.PUT.default.title',
              defaultMessage: 'Saving Login Details Failed',
            },
          })
        ),
      },
    })
      .then(json => {
        dispatch(
          createReceiveUpdatedLoginDetails(json.data, {
            access: json.access,
            refresh: json.refresh,
            clientId: json.clientId,
          })
        )
      })
      .catch(err => {
        if (
          ['Incorrect password.', 'Username already in use'].includes(
            err.message
          )
        ) {
          dispatch(createReceiveUpdatedLoginDetailsExpectedError())
          const submissionError = { _error: err.message }
          if (err.message === 'Incorrect password.') {
            submissionError.currentPassword =
              'The password that you entered is not valid'
          } else if (err.message === 'Username already in use') {
            submissionError.username = 'This username is unavailable'
          }
          throw new SubmissionError(submissionError)
        }
      })
  }
}

function createReceiveUpdatedUserPreferences(accountDetails) {
  return {
    type: types.RECEIVE_UPDATED_USER_PREFERENCES,
    accountDetails,
  }
}

export function saveUserPreferences(userPreferences) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart())
    return aspectFetch('/account-details/current-preferences', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(userPreferences),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.saveUserPreferences.PUT.default.title',
              defaultMessage: 'Saving User Preferences Failed',
            },
          })
        ),
      },
    }).then(({ data }) => {
      dispatch(createReceiveUpdatedUserPreferences(data))
    })
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const AccountDetailsData = Immutable.Record({
  contactDetails: new ContactDetails(),
  loginDetails: new LoginDetails(),
  userPreferences: new UserPreferences(),
})
export const AccountDetails = Immutable.Record({
  loading: false,
  saving: false,
  data: new AccountDetailsData(),
})

const initialState = new AccountDetails()

function requestAccountDetails(state) {
  return state.merge({
    loading: true,
  })
}

function receiveAccountDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: new ContactDetails(
        _.pick(
          accountDetailsData,
          Object.keys(state.getIn(['data', 'contactDetails']).toJS())
        )
      ),
      loginDetails: new LoginDetails({
        id: accountDetailsData.userId,
        username: accountDetailsData.username,
      }),
      userPreferences: new UserPreferences(
        _.pick(
          accountDetailsData,
          Object.keys(state.getIn(['data', 'userPreferences']).toJS())
        )
      ),
    }),
  })
}

function saveAccountDetailsStart(state) {
  return state.merge({
    saving: true,
  })
}

function receiveUpdatedContactDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: new ContactDetails(
        _.pick(
          accountDetailsData,
          Object.keys(state.getIn(['data', 'contactDetails']).toJS())
        )
      ),
      loginDetails: state.getIn(['data', 'loginDetails']),
      userPreferences: state.getIn(['data', 'userPreferences']),
    }),
  })
}

function receiveUpdatedLoginDetails(state, updateDetails) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: new LoginDetails({
        ...state.getIn(['data', 'loginDetails']).toJS(),
        username: updateDetails.username,
        currentPassword: null,
      }),
      userPreferences: state.getIn(['data', 'userPreferences']),
    }),
  })
}

function receiveUpdatedLoginDetailsExpectedError(state) {
  return state.merge({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: new LoginDetails({
        ...state.getIn(['data', 'loginDetails']).toJS(),
        currentPassword: null,
      }),
      userPreferences: state.getIn(['data', 'userPreferences']),
    }),
  })
}

function receiveUpdatedUserPreferences(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: state.getIn(['data', 'loginDetails']),
      userPreferences: new UserPreferences(
        _.pick(
          accountDetailsData,
          Object.keys(state.getIn(['data', 'userPreferences']).toJS())
        )
      ),
    }),
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
    case types.RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR:
      return receiveUpdatedLoginDetailsExpectedError(state)
    default:
      return state
  }
}
