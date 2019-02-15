"use strict";

var _react = _interopRequireDefault(require("react"));

var _shallow = _interopRequireDefault(require("react-test-renderer/shallow"));

var _reactIntl = require("react-intl");

var _AppNotificationDialog = require("./AppNotificationDialog");

var _AppNotificationRedux = require("./AppNotificationRedux");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('App Notification Dialog component', () => {
  const renderer = new _shallow.default();
  const intlProvider = new _reactIntl.IntlProvider({
    locale: 'en'
  }, {});
  const {
    intl
  } = intlProvider.getChildContext();
  const appNotification = new _AppNotificationRedux.Error();
  const props = {
    intl,
    appNotification,
    hideAppNotification: _AppNotificationRedux.hideAppNotification,
    showMoreDetails: _AppNotificationRedux.showMoreDetails
  };
  it('should shallow render correctly', () => {
    const element = renderer.render(_react.default.createElement(_AppNotificationDialog.AppNotificationDialog, props));
    expect(element).toMatchSnapshot();
  });
});