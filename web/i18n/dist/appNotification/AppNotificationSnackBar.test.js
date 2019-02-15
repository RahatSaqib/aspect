"use strict";

var _react = _interopRequireDefault(require("react"));

var _shallow = _interopRequireDefault(require("react-test-renderer/shallow"));

var _reactIntl = require("react-intl");

var _immutable = _interopRequireDefault(require("immutable"));

var _AppNotificationSnackBar = require("./AppNotificationSnackBar");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('App Notification SnackBar component', () => {
  const renderer = new _shallow.default();
  const intlProvider = new _reactIntl.IntlProvider({
    locale: 'en'
  }, {});
  const {
    intl
  } = intlProvider.getChildContext();

  const notificationOptions = _immutable.default.fromJS({
    showAs: 'interrupt',
    showClose: true,
    showProceed: false,
    severity: 'warn',
    title: {
      id: 'errorResponseMessages.loginStart.POST.default.default.title',
      defaultMessage: 'Login Failed'
    },
    message: {
      id: 'errorResponseMessages.loginStart.POST.default.default.message',
      defaultMessage: 'The details that you have entered are incorrect'
    },
    resolution: {
      id: 'errorResponseMessages.loginStart.POST.default.resolution',
      defaultMessage: 'Please re-enter your login details and try again?'
    }
  });

  const Error = _immutable.default.Record({
    hasNotification: true,
    notificationType: 'error',
    messageValues: {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication failed. Wrong password.'
    },
    showDetails: true,
    notificationOptions
  });

  const appNotification = new Error();
  const props = {
    intl,
    appNotification,
    hideAppNotification: () => {},
    showMoreDetails: () => {}
  };
  it('should shallow render correctly', () => {
    const element = renderer.render(_react.default.createElement(_AppNotificationSnackBar.StyledAppNotificationSnackBar, props));
    expect(element).toMatchSnapshot();
  });
});