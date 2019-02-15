"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchAccountDetails = fetchAccountDetails;
exports.saveContactDetails = saveContactDetails;
exports.saveLoginDetails = saveLoginDetails;
exports.saveUserPreferences = saveUserPreferences;
exports.default = accountDetailsReducer;
exports.AccountDetails = exports.AccountDetailsData = exports.types = void 0;

var _pick2 = _interopRequireDefault(require("lodash/pick"));

var _reactIntl = require("react-intl");

var _immutable = _interopRequireDefault(require("immutable"));

var _immutable2 = require("redux-form/immutable");

var _browser = require("../shared/utils/browser");

var _fetch = require("../shared/utils/fetch");

var _PersonRedux = require("../person/PersonRedux");

var _CommonErrorNotifications = require("../error/CommonErrorNotifications");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

const types = {
  REQUEST_ACCOUNT_DETAILS: 'REQUEST_ACCOUNT_DETAILS',
  RECEIVE_ACCOUNT_DETAILS: 'RECEIVE_ACCOUNT_DETAILS',
  SAVE_ACCOUNT_DETAILS_START: 'SAVE_ACCOUNT_DETAILS_START',
  RECEIVE_UPDATED_CONTACT_DETAILS: 'RECEIVE_UPDATED_CONTACT_DETAILS',
  RECEIVE_UPDATED_LOGIN_DETAILS: 'RECEIVE_UPDATED_LOGIN_DETAILS',
  RECEIVE_UPDATED_USER_PREFERENCES: 'RECEIVE_UPDATED_USER_PREFERENCES',
  RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR: 'RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR'
  /*
   * ---------------- Action Creators -----------------
   */

};
exports.types = types;

function createRequestAccountDetails() {
  return {
    type: types.REQUEST_ACCOUNT_DETAILS
  };
}

function createReceiveAccountDetails(accountDetails) {
  return {
    type: types.RECEIVE_ACCOUNT_DETAILS,
    accountDetails
  };
}

function fetchAccountDetails() {
  return dispatch => {
    dispatch(createRequestAccountDetails());
    return (0, _fetch.aspectFetch)('/account-details/current', {
      errorNotifications: {
        default: (0, _CommonErrorNotifications.errorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.fetchAccountDetails.GET.default.title",
            "defaultMessage": "Loading Account Details Failed"
          }
        }))
      }
    }).then(json => dispatch(createReceiveAccountDetails(json.data)));
  };
}

function createSaveAccountDetailsStart() {
  return {
    type: types.SAVE_ACCOUNT_DETAILS_START
  };
}

function createReceiveUpdatedContactDetails(accountDetails) {
  return {
    type: types.RECEIVE_UPDATED_CONTACT_DETAILS,
    accountDetails
  };
}

function saveContactDetails(contactDetails) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart());
    return (0, _fetch.aspectFetch)('/account-details/current-contact', {
      method: 'PUT',
      body: JSON.stringify(contactDetails),
      errorNotifications: {
        default: (0, _CommonErrorNotifications.errorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.saveContactDetails.PUT.default.title",
            "defaultMessage": "Saving Contact Details Failed"
          }
        }))
      }
    }).then(json => dispatch(createReceiveUpdatedContactDetails(json.data)));
  };
}

function createReceiveUpdatedLoginDetails(updateDetails, data) {
  return {
    type: types.RECEIVE_UPDATED_LOGIN_DETAILS,
    data,
    updateDetails
  };
}

function createReceiveUpdatedLoginDetailsExpectedError() {
  return {
    type: types.RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR
  };
}

function saveLoginDetails(loginDetails) {
  return (dispatch, getState) => {
    dispatch(createSaveAccountDetailsStart());
    const state = getState();
    const {
      clientId
    } = state.user;
    return (0, _fetch.aspectFetch)('/auth/update-login-details', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: loginDetails.currentPassword,
        newUsername: loginDetails.username,
        newPassword: loginDetails.newPassword,
        clientId,
        clientName: (0, _browser.getClientName)()
      }),
      errorNotifications: {
        409: (0, _CommonErrorNotifications.inlineWarning)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.saveLoginDetails.PUT.409.title",
            "defaultMessage": "This Username is Unavailable"
          },
          message: {
            "id": "errorResponseMessages.saveLoginDetails.PUT.409.message",
            "defaultMessage": "The username that you have entered is already in use by another user on the system"
          },
          resolution: {
            "id": "errorResponseMessages.saveLoginDetails.PUT.409.resolution",
            "defaultMessage": "Please try another username"
          }
        })),
        403: (0, _CommonErrorNotifications.inlineWarning)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.saveLoginDetails.PUT.403.title",
            "defaultMessage": "Invalid Password"
          },
          message: {
            "id": "errorResponseMessages.saveLoginDetails.PUT.403.message",
            "defaultMessage": "The current password that you have entered is incorrect."
          },
          resolution: {
            "id": "errorResponseMessages.saveLoginDetails.PUT.403.resolution",
            "defaultMessage": "Please try re-entering your password or contact us to reset your login details"
          }
        })),
        default: (0, _CommonErrorNotifications.errorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.saveLoginDetails.PUT.default.title",
            "defaultMessage": "Saving Login Details Failed"
          }
        }))
      }
    }).then(json => {
      dispatch(createReceiveUpdatedLoginDetails(json.data, {
        access: json.access,
        refresh: json.refresh,
        clientId: json.clientId
      }));
    }).catch(err => {
      if (['Incorrect password.', 'Username already in use'].includes(err.message)) {
        dispatch(createReceiveUpdatedLoginDetailsExpectedError());
        const submissionError = {
          _error: err.message
        };

        if (err.message === 'Incorrect password.') {
          submissionError.currentPassword = 'The password that you entered is not valid';
        } else if (err.message === 'Username already in use') {
          submissionError.username = 'This username is unavailable';
        }

        throw new _immutable2.SubmissionError(submissionError);
      }
    });
  };
}

function createReceiveUpdatedUserPreferences(accountDetails) {
  return {
    type: types.RECEIVE_UPDATED_USER_PREFERENCES,
    accountDetails
  };
}

function saveUserPreferences(userPreferences) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart());
    return (0, _fetch.aspectFetch)('/account-details/current-preferences', {
      method: 'PUT',
      body: JSON.stringify(userPreferences),
      errorNotifications: {
        default: (0, _CommonErrorNotifications.errorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.saveUserPreferences.PUT.default.title",
            "defaultMessage": "Saving User Preferences Failed"
          }
        }))
      }
    }).then(({
      data
    }) => {
      dispatch(createReceiveUpdatedUserPreferences(data));
    });
  };
}
/*
 * ---------------- Reducers -----------------
 */


const AccountDetailsData = _immutable.default.Record({
  contactDetails: new _PersonRedux.ContactDetails(),
  loginDetails: new _PersonRedux.LoginDetails(),
  userPreferences: new _PersonRedux.UserPreferences()
});

exports.AccountDetailsData = AccountDetailsData;

const AccountDetails = _immutable.default.Record({
  loading: false,
  saving: false,
  data: new AccountDetailsData()
});

exports.AccountDetails = AccountDetails;
const initialState = new AccountDetails();

function requestAccountDetails(state) {
  return state.merge({
    loading: true
  });
}

function receiveAccountDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: new _PersonRedux.ContactDetails((0, _pick2.default)(accountDetailsData, Object.keys(state.getIn(['data', 'contactDetails']).toJS()))),
      loginDetails: new _PersonRedux.LoginDetails({
        id: accountDetailsData.userId,
        username: accountDetailsData.username
      }),
      userPreferences: new _PersonRedux.UserPreferences((0, _pick2.default)(accountDetailsData, Object.keys(state.getIn(['data', 'userPreferences']).toJS())))
    })
  });
}

function saveAccountDetailsStart(state) {
  return state.merge({
    saving: true
  });
}

function receiveUpdatedContactDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: new _PersonRedux.ContactDetails((0, _pick2.default)(accountDetailsData, Object.keys(state.getIn(['data', 'contactDetails']).toJS()))),
      loginDetails: state.getIn(['data', 'loginDetails']),
      userPreferences: state.getIn(['data', 'userPreferences'])
    })
  });
}

function receiveUpdatedLoginDetails(state, updateDetails) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: new _PersonRedux.LoginDetails({ ...state.getIn(['data', 'loginDetails']).toJS(),
        username: updateDetails.username,
        currentPassword: null
      }),
      userPreferences: state.getIn(['data', 'userPreferences'])
    })
  });
}

function receiveUpdatedLoginDetailsExpectedError(state) {
  return state.merge({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: new _PersonRedux.LoginDetails({ ...state.getIn(['data', 'loginDetails']).toJS(),
        currentPassword: null
      }),
      userPreferences: state.getIn(['data', 'userPreferences'])
    })
  });
}

function receiveUpdatedUserPreferences(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: new AccountDetailsData({
      contactDetails: state.getIn(['data', 'contactDetails']),
      loginDetails: state.getIn(['data', 'loginDetails']),
      userPreferences: new _PersonRedux.UserPreferences((0, _pick2.default)(accountDetailsData, Object.keys(state.getIn(['data', 'userPreferences']).toJS())))
    })
  });
}

function accountDetailsReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_ACCOUNT_DETAILS:
      return requestAccountDetails(state);

    case types.RECEIVE_ACCOUNT_DETAILS:
      return receiveAccountDetails(state, action.accountDetails);

    case types.SAVE_ACCOUNT_DETAILS_START:
      return saveAccountDetailsStart(state);

    case types.RECEIVE_UPDATED_CONTACT_DETAILS:
      return receiveUpdatedContactDetails(state, action.accountDetails);

    case types.RECEIVE_UPDATED_LOGIN_DETAILS:
      return receiveUpdatedLoginDetails(state, action.updateDetails);

    case types.RECEIVE_UPDATED_USER_PREFERENCES:
      return receiveUpdatedUserPreferences(state, action.accountDetails);

    case types.RECEIVE_UPDATED_LOGIN_DETAILS_EXPECTED_ERROR:
      return receiveUpdatedLoginDetailsExpectedError(state);

    default:
      return state;
  }
}

;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(types, "types", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(createRequestAccountDetails, "createRequestAccountDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(createReceiveAccountDetails, "createReceiveAccountDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(fetchAccountDetails, "fetchAccountDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(createSaveAccountDetailsStart, "createSaveAccountDetailsStart", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(createReceiveUpdatedContactDetails, "createReceiveUpdatedContactDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(saveContactDetails, "saveContactDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(createReceiveUpdatedLoginDetails, "createReceiveUpdatedLoginDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(createReceiveUpdatedLoginDetailsExpectedError, "createReceiveUpdatedLoginDetailsExpectedError", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(saveLoginDetails, "saveLoginDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(createReceiveUpdatedUserPreferences, "createReceiveUpdatedUserPreferences", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(saveUserPreferences, "saveUserPreferences", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(AccountDetailsData, "AccountDetailsData", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(AccountDetails, "AccountDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(initialState, "initialState", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(requestAccountDetails, "requestAccountDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(receiveAccountDetails, "receiveAccountDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(saveAccountDetailsStart, "saveAccountDetailsStart", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(receiveUpdatedContactDetails, "receiveUpdatedContactDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(receiveUpdatedLoginDetails, "receiveUpdatedLoginDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(receiveUpdatedLoginDetailsExpectedError, "receiveUpdatedLoginDetailsExpectedError", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(receiveUpdatedUserPreferences, "receiveUpdatedUserPreferences", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  reactHotLoader.register(accountDetailsReducer, "accountDetailsReducer", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/AccountRedux.js");
  leaveModule(module);
})();

;