"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.showError = showError;
exports.showAcknowledgement = showAcknowledgement;
exports.showMoreDetails = showMoreDetails;
exports.hideAppNotification = hideAppNotification;
exports.default = appNotificationReducer;
exports.Error = exports.types = void 0;

var _immutable = _interopRequireDefault(require("immutable"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

const types = {
  SHOW_APP_NOTIFICATION: 'SHOW_APP_NOTIFICATION',
  SHOW_MORE_DETAILS: 'SHOW_MORE_DETAILS',
  HIDE_APP_NOTIFICATION: 'HIDE_APP_NOTIFICATION'
  /*
   * ---------------- Action Creators -----------------
   */

};
exports.types = types;

function showNotification(options, messageValues, notificationType) {
  return {
    type: types.SHOW_APP_NOTIFICATION,
    notificationType,
    notificationOptions: {
      showAs: notificationType === 'acknowledgement' ? 'inline' : 'interrupt',
      showClose: true,
      showProceed: false,
      ...options
    },
    messageValues: { ...(messageValues || {}),
      ...options.messageValues
    }
  };
}

function showError(options, messageValues) {
  return showNotification(options, messageValues, 'error');
}

function showAcknowledgement(options, messageValues) {
  return showNotification(options, messageValues, 'acknowledgement');
}

function showMoreDetails() {
  return {
    type: types.SHOW_MORE_DETAILS
  };
}

function hideAppNotification() {
  return {
    type: types.HIDE_APP_NOTIFICATION
  };
}
/*
 * ---------------- Reducers -----------------
 */


const Error = _immutable.default.Record({
  hasNotification: false,
  notificationType: null,
  messageValues: {},
  showDetails: false,
  notificationOptions: null
});

exports.Error = Error;
const initialState = new Error();

function appNotificationReducer(state = initialState, action) {
  switch (action.type) {
    case types.SHOW_APP_NOTIFICATION:
      return state.merge({
        hasNotification: true,
        notificationType: action.notificationType,
        notificationOptions: action.notificationOptions,
        messageValues: action.messageValues || {},
        showDetails: action.notificationOptions.showAs === 'interrupt'
      });

    case types.SHOW_MORE_DETAILS:
      return state.set('showDetails', true);

    case types.HIDE_APP_NOTIFICATION:
      return state.merge({
        hasNotification: false,
        notificationType: null,
        showDetails: false,
        notificationOptions: null,
        messageValues: {}
      });

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

  reactHotLoader.register(types, "types", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(showNotification, "showNotification", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(showError, "showError", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(showAcknowledgement, "showAcknowledgement", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(showMoreDetails, "showMoreDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(hideAppNotification, "hideAppNotification", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(Error, "Error", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(initialState, "initialState", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  reactHotLoader.register(appNotificationReducer, "appNotificationReducer", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationRedux.js");
  leaveModule(module);
})();

;