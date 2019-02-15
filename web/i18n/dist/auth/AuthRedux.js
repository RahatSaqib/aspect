"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hydrateFromLocalStorage = hydrateFromLocalStorage;
exports.toggleDrawer = toggleDrawer;
exports.closeDrawer = closeDrawer;
exports.loginStart = loginStart;
exports.userRequestedLogout = userRequestedLogout;
exports.idleLogout = idleLogout;
exports.refreshStart = refreshStart;
exports.resetPasswordEnterEmailAddress = resetPasswordEnterEmailAddress;
exports.resetPasswordEnterPassword = resetPasswordEnterPassword;
exports.fetchFeatures = fetchFeatures;
exports.fetchLicense = fetchLicense;
exports.acceptLicenseStart = acceptLicenseStart;
exports.default = authReducer;
exports.types = void 0;

var _pick2 = _interopRequireDefault(require("lodash/pick"));

var _isNil2 = _interopRequireDefault(require("lodash/isNil"));

var _forEach2 = _interopRequireDefault(require("lodash/forEach"));

var _reactIntl = require("react-intl");

var _immutable = _interopRequireDefault(require("immutable"));

var _jwtDecode = _interopRequireDefault(require("jwt-decode"));

var _immutable2 = require("redux-form/immutable");

var _config = _interopRequireDefault(require("../config"));

var _browser = require("../shared/utils/browser");

var _fetch = require("../shared/utils/fetch");

var _CommonErrorNotifications = require("../error/CommonErrorNotifications");

var _AccountRedux = require("../account/AccountRedux");

var _loggedOutReasons = require("./loggedOutReasons");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

const types = {
  HYDRATE_FROM_LOCAL_STORAGE: 'HYDRATE_FROM_LOCAL_STORAGE',
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REFRESH_SUCCESS: 'REFRESH_SUCCESS',
  REFRESH_FAILURE: 'REFRESH_FAILURE',
  LOGOUT: 'LOGOUT',
  TOGGLE_DRAWER: 'TOGGLE_DRAWER',
  CLOSE_DRAWER: 'CLOSE_DRAWER',
  RESET_PASSWORD_ENTER_PASSWORD_SUCCESS: 'RESET_PASSWORD_ENTER_PASSWORD_SUCCESS',
  REQUEST_FEATURES: 'REQUEST_FEATURES',
  RECEIVE_FEATURES: 'RECEIVE_FEATURES',
  REQUEST_LICENSE: 'REQUEST_LICENSE',
  RECEIVE_LICENSE: 'RECEIVE_LICENSE',
  ACCEPT_LICENSE_REQUEST: 'ACCEPT_LICENSE_REQUEST',
  ACCEPT_LICENSE_SUCCESS: 'ACCEPT_LICENSE_SUCCESS',
  ACCEPT_LICENSE_FAILURE: 'ACCEPT_LICENSE_FAILURE'
  /*
   * ---------------- Action Creators -----------------
   */

};
exports.types = types;

function hydrateFromLocalStorage(data) {
  return {
    type: types.HYDRATE_FROM_LOCAL_STORAGE,
    data
  };
}

function toggleDrawer() {
  return {
    type: types.TOGGLE_DRAWER
  };
}

function closeDrawer() {
  return {
    type: types.CLOSE_DRAWER
  };
}

function loginRequest(requestedAt) {
  return {
    type: types.LOGIN_REQUEST,
    requestedAt
  };
}

function loginSuccess(requestedAt, data) {
  return {
    type: types.LOGIN_SUCCESS,
    requestedAt,
    data
  };
}

function loginFailure(err) {
  return {
    type: types.LOGIN_FAILURE,
    err
  };
}

function loginStart({
  user,
  password
}) {
  return function (dispatch, getState) {
    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    const requestedAt = Date.now();
    dispatch(loginRequest(requestedAt));
    const state = getState();
    const {
      clientId
    } = state.user;
    return (0, _fetch.aspectFetch)('/auth', {
      method: 'POST',
      body: JSON.stringify({
        name: user,
        password,
        clientId,
        clientName: (0, _browser.getClientName)()
      }),
      errorNotifications: {
        401: {
          'Your account is locked.': {
            severity: 'warn',
            ...(0, _reactIntl.defineMessages)({
              title: {
                "id": "errorResponseMessages.loginStart.POST.401.accountLocked.title",
                "defaultMessage": "Login Failed"
              },
              message: {
                "id": "errorResponseMessages.loginStart.POST.401.accountLocked.message",
                "defaultMessage": "Your user account has been locked"
              },
              resolution: {
                "id": "errorResponseMessages.loginStart.POST.401.accountLocked.resolution",
                "defaultMessage": "You can contact us to unlock your account for you by email ({supportEmail})"
              }
            }),
            messageValues: {
              supportEmail: _config.default.supportEmail
            }
          },
          default: {
            severity: 'warn',
            ...(0, _reactIntl.defineMessages)({
              title: {
                "id": "errorResponseMessages.loginStart.POST.default.default.title",
                "defaultMessage": "Login Failed"
              },
              message: {
                "id": "errorResponseMessages.loginStart.POST.default.default.message",
                "defaultMessage": "The details that you have entered are incorrect"
              },
              resolution: {
                "id": "errorResponseMessages.loginStart.POST.default.resolution",
                "defaultMessage": "Please re-enter your login details and try again?"
              }
            })
          }
        },
        default: (0, _CommonErrorNotifications.errorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.loginStart.POST.default.title",
            "defaultMessage": "Login Error"
          }
        }))
      }
    }).then(json => dispatch(loginSuccess(requestedAt, {
      access: json.access,
      refresh: json.refresh,
      clientId: json.clientId,
      culture: json.culture,
      timezoneId: json.timezone,
      displayPreferences: _immutable.default.Map(json.displayPreferences)
    }))).then(() => dispatch(fetchFeatures())).catch(err => dispatch(loginFailure(err)));
  };
}

function userRequestedLogout() {
  return {
    type: types.LOGOUT,
    data: {
      reason: _loggedOutReasons.reasonTypes.userRequested
    }
  };
}

function idleLogout() {
  return {
    type: types.LOGOUT,
    data: {
      reason: _loggedOutReasons.reasonTypes.idle
    }
  };
}

function refreshSuccess(data) {
  return {
    type: types.REFRESH_SUCCESS,
    data
  };
}

function refreshFailure() {
  return {
    type: types.REFRESH_FAILURE,
    data: {
      reason: _loggedOutReasons.reasonTypes.refreshJWTFailure
    }
  };
}

function refreshStart() {
  return function (dispatch, getState) {
    const state = getState();
    const {
      clientId,
      refresh
    } = state.user;

    if (!refresh) {
      return Promise.resolve();
    } // try to get a new access token:


    return (0, _fetch.aspectFetch)('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        token: refresh,
        clientId
      })
    }).then(json => dispatch(refreshSuccess({
      access: json.access,
      refresh: json.refresh,
      clientId: json.clientId
    }))).then(() => dispatch(fetchFeatures())).catch(() => {
      dispatch(refreshFailure());
    });
  };
}

function resetPasswordEnterEmailAddress(emailAddress) {
  return function (dispatch, getState) {
    const state = getState();
    const {
      clientId
    } = state.user;
    return (0, _fetch.aspectFetch)(`/auth/send-reset-password-token/${emailAddress}`, {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        clientName: (0, _browser.getClientName)()
      }),
      errorNotifications: {
        default: (0, _CommonErrorNotifications.inlineErrorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.resetPasswordEnterEmailAddress.POST.default.title",
            "defaultMessage": "Error Sending Reset Password Email"
          }
        }))
      }
    }).catch(err => {
      throw new _immutable2.SubmissionError({
        _error: err.message
      });
    });
  };
}

function createResetPasswordEnterPasswordSuccess(username) {
  return {
    type: types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS,
    username
  };
}

function resetPasswordEnterPassword(resetPasswordToken, newPassword) {
  return function (dispatch, getState) {
    const state = getState();
    const {
      clientId
    } = state.user;
    return (0, _fetch.aspectFetch)(`/auth/update-password/${resetPasswordToken}`, {
      method: 'PUT',
      body: JSON.stringify({
        newPassword,
        clientId,
        clientName: (0, _browser.getClientName)()
      }),
      errorNotifications: {
        default: (0, _CommonErrorNotifications.inlineErrorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.resetPasswordEnterPassword.POST.default.title",
            "defaultMessage": "Error Saving New Password"
          }
        }))
      }
    }).then(json => {
      dispatch(createResetPasswordEnterPasswordSuccess(json.username));
    }).catch(err => {
      throw new _immutable2.SubmissionError({
        _error: err.message
      });
    });
  };
}

function requestFeatures() {
  return {
    type: types.REQUEST_FEATURES
  };
}

function receiveFeatures(data) {
  return {
    type: types.RECEIVE_FEATURES,
    data
  };
}

function fetchFeatures() {
  return dispatch => {
    dispatch(requestFeatures());
    return (0, _fetch.aspectFetch)('/auth/features').then(json => dispatch(receiveFeatures(json.data)));
  };
}

function requestLicense() {
  return {
    type: types.REQUEST_LICENSE
  };
}

function receiveLicense(data) {
  return {
    type: types.RECEIVE_LICENSE,
    data
  };
}

function fetchLicense(licenseId) {
  return dispatch => {
    dispatch(requestLicense());
    return (0, _fetch.aspectFetch)(`/auth/license?licenseId=${licenseId}`).then(json => dispatch(receiveLicense(json.data)));
  };
}

function acceptLicenseRequest(requestedAt) {
  return {
    type: types.ACCEPT_LICENSE_REQUEST,
    requestedAt
  };
}

function acceptLicenseSuccess(requestedAt, data) {
  return {
    type: types.ACCEPT_LICENSE_SUCCESS,
    requestedAt,
    data
  };
}

function acceptLicenseFailure(err) {
  return {
    type: types.ACCEPT_LICENSE_FAILURE,
    err
  };
}

function acceptLicenseStart(licenseId) {
  return function (dispatch, getState) {
    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    const requestedAt = Date.now();
    dispatch(acceptLicenseRequest(requestedAt));
    const state = getState();
    const {
      clientId,
      refresh
    } = state.user;
    return (0, _fetch.aspectFetch)('/auth/license', {
      method: 'POST',
      body: JSON.stringify({
        licenseId,
        clientId,
        token: refresh
      }),
      errorNotifications: {
        default: (0, _CommonErrorNotifications.errorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.loginStart.POST.default.title",
            "defaultMessage": "Login Error"
          }
        }))
      }
    }).then(json => dispatch(acceptLicenseSuccess(requestedAt, {
      access: json.access,
      refresh: json.refresh,
      clientId: json.clientId,
      culture: json.culture,
      timezoneId: json.timezone,
      displayPreferences: _immutable.default.Map(json.displayPreferences)
    }))).then(() => dispatch(fetchFeatures())).catch(err => dispatch(acceptLicenseFailure(err)));
  };
}
/*
 * ---------------- Reducers -----------------
 */


const JWT = _immutable.default.Record({
  name: '',
  permissions: _immutable.default.Set(),
  hasToAcceptLicenseId: undefined,
  iat: undefined,
  exp: undefined,
  iss: ''
});

const User = _immutable.default.Record({
  requestedAt: undefined,
  jwt: new JWT(),
  access: undefined,
  refresh: undefined,
  clientId: undefined,
  culture: 'en-US',
  timezoneId: 'Eastern Standard Time',
  displayPreferences: _immutable.default.Map(),
  drawerOpen: false,
  loggedOutReason: '',
  features: _immutable.default.Set(),
  licenseContent: undefined
});

const initialState = new User();

function authReducer(state = initialState, action) {
  switch (action.type) {
    case types.LOGIN_REQUEST:
    case types.ACCEPT_LICENSE_REQUEST:
      return state.set('requestedAt', action.requestedAt);

    case types.HYDRATE_FROM_LOCAL_STORAGE:
      if (action.data === false) {
        return state;
      }

    // fallthrough

    case types.LOGIN_SUCCESS:
    case types.REFRESH_SUCCESS:
    case _AccountRedux.types.RECEIVE_UPDATED_LOGIN_DETAILS:
    case types.ACCEPT_LICENSE_SUCCESS:
      return state.withMutations(mutState => {
        mutState.delete('requestedAt');
        mutState.delete('licenseContent');
        (0, _forEach2.default)(action.data, (v, k) => {
          if (!(0, _isNil2.default)(v)) {
            mutState.set(k, v);
          }
        });
        mutState.mergeDeepIn(['jwt'], (0, _pick2.default)((0, _jwtDecode.default)(action.data.access), ['name', 'permissions', 'hasToAcceptLicenseId', 'iat', 'exp', 'iss']));
      });

    case types.LOGIN_FAILURE:
    case types.ACCEPT_LICENSE_FAILURE:
      return state.delete('requestedAt');
    // fallthrough

    case types.REFRESH_FAILURE:
    case types.LOGOUT:
      return state.clear().set('loggedOutReason', action.data.reason);

    case types.TOGGLE_DRAWER:
      return state.set('drawerOpen', !state.drawerOpen);

    case types.CLOSE_DRAWER:
      return state.set('drawerOpen', false);

    case _AccountRedux.types.RECEIVE_UPDATED_USER_PREFERENCES:
      return state.merge({
        culture: action.accountDetails.culture,
        timezoneId: action.accountDetails.timezone
      });

    case types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS:
      return state;

    case types.RECEIVE_FEATURES:
      return state.set('features', _immutable.default.Set(action.data.map(x => x.module)));

    case types.RECEIVE_LICENSE:
      return state.set('licenseContent', action.data.content);

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

  reactHotLoader.register(types, "types", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(hydrateFromLocalStorage, "hydrateFromLocalStorage", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(toggleDrawer, "toggleDrawer", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(closeDrawer, "closeDrawer", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(loginRequest, "loginRequest", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(loginSuccess, "loginSuccess", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(loginFailure, "loginFailure", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(loginStart, "loginStart", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(userRequestedLogout, "userRequestedLogout", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(idleLogout, "idleLogout", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(refreshSuccess, "refreshSuccess", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(refreshFailure, "refreshFailure", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(refreshStart, "refreshStart", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(resetPasswordEnterEmailAddress, "resetPasswordEnterEmailAddress", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(createResetPasswordEnterPasswordSuccess, "createResetPasswordEnterPasswordSuccess", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(resetPasswordEnterPassword, "resetPasswordEnterPassword", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(requestFeatures, "requestFeatures", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(receiveFeatures, "receiveFeatures", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(fetchFeatures, "fetchFeatures", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(requestLicense, "requestLicense", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(receiveLicense, "receiveLicense", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(fetchLicense, "fetchLicense", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(acceptLicenseRequest, "acceptLicenseRequest", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(acceptLicenseSuccess, "acceptLicenseSuccess", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(acceptLicenseFailure, "acceptLicenseFailure", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(acceptLicenseStart, "acceptLicenseStart", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(JWT, "JWT", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(User, "User", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(initialState, "initialState", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  reactHotLoader.register(authReducer, "authReducer", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/AuthRedux.js");
  leaveModule(module);
})();

;