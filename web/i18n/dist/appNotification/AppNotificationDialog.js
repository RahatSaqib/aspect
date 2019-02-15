"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AppNotificationDialog = void 0;

var _flowRight2 = _interopRequireDefault(require("lodash/flowRight"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _redux = require("redux");

var _reactRedux = require("react-redux");

var _reactIntl = require("react-intl");

var _Button = _interopRequireDefault(require("@material-ui/core/Button"));

var _Error = _interopRequireDefault(require("@material-ui/icons/Error"));

var _Warning = _interopRequireDefault(require("@material-ui/icons/Warning"));

var _Info = _interopRequireDefault(require("@material-ui/icons/Info"));

var _lightBlue = _interopRequireDefault(require("@material-ui/core/colors/lightBlue"));

var _orange = _interopRequireDefault(require("@material-ui/core/colors/orange"));

var _red = _interopRequireDefault(require("@material-ui/core/colors/red"));

var _AspectDialog = _interopRequireDefault(require("../components/shared/AspectDialog"));

var _AppNotificationRedux = require("./AppNotificationRedux");

var _AppNotificationDialog = _interopRequireDefault(require("./AppNotificationDialog.css"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const genericMessages = (0, _reactIntl.defineMessages)({
  title: {
    "id": "errorResponseMessages.generic.title",
    "defaultMessage": "Aspect has Encountered a Problem."
  },
  message: {
    "id": "errorResponseMessages.generic.message",
    "defaultMessage": "Our technical team has been notified of the problem and will attend to it as soon as possible."
  },
  closeText: {
    "id": "errorResponseMessages.generic.closeText",
    "defaultMessage": "Close"
  },
  proceedText: {
    "id": "errorResponseMessages.generic.proceedText",
    "defaultMessage": "Proceed"
  }
});
const enhance = (0, _flowRight2.default)((0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps));

class AppNotificationDialog extends _react.PureComponent {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "handleClose", () => {
      const onClose = this.props.appNotification.getIn(['notificationOptions', 'onClose']);

      if (onClose) {
        onClose();
      }

      if (this.props.appNotification.get('hasNotification')) {
        this.props.hideAppNotification();
      }
    });

    _defineProperty(this, "handleProceed", () => {
      const onProceed = this.props.appNotification.getIn(['notificationOptions', 'onProceed']);

      if (onProceed) {
        onProceed();
      }

      if (this.props.appNotification.get('notificationOptions')) {
        this.props.hideAppNotification();
      }
    });
  }

  render() {
    const {
      appNotification,
      intl: {
        formatMessage
      }
    } = this.props;

    const toJSOrDefault = (immutableObject, defaultValue) => immutableObject && immutableObject.toJS ? immutableObject.toJS() : defaultValue;

    const appNotificationMessageOrDefault = (messageKey, fallbackMessage) => toJSOrDefault(appNotification.getIn(['notificationOptions', messageKey]), fallbackMessage);

    const notificationOptions = toJSOrDefault(appNotification.get('notificationOptions'), {});
    const messageValues = toJSOrDefault(appNotification.get('messageValues'), {});
    const isError = appNotification.getIn(['notificationOptions', 'notificationType']) === 'error';
    const title = appNotificationMessageOrDefault('title', isError ? genericMessages.title : undefined);
    const actions = [];
    const {
      showProceed
    } = notificationOptions;

    if (notificationOptions.showClose) {
      const closeText = appNotificationMessageOrDefault('closeText', genericMessages.closeText);
      actions.push(_react.default.createElement(_Button.default, {
        color: !showProceed ? 'primary' : '',
        onClick: this.handleClose
      }, formatMessage(closeText, messageValues)));
    }

    if (showProceed) {
      const proceedText = appNotificationMessageOrDefault('proceedText', genericMessages.proceedText);
      actions.push(_react.default.createElement(_Button.default, {
        color: "primary",
        onClick: this.handleProceed
      }, formatMessage(proceedText, messageValues)));
    }

    const message = appNotificationMessageOrDefault('message', isError ? genericMessages.message : undefined);
    const resolution = appNotificationMessageOrDefault('resolution', isError ? genericMessages.resolution : undefined);
    const iconStyle = {
      width: '6em',
      height: '6em'
    };
    const hasNotification = appNotification.get('hasNotification');
    const showDetails = appNotification.get('showDetails');
    return _react.default.createElement(_AspectDialog.default, {
      title: title ? formatMessage(title, messageValues) : '',
      actions: actions,
      modal: showProceed,
      autoScrollBodyContent: true,
      open: hasNotification && showDetails,
      onRequestClose: this.handleClose
    }, notificationOptions.severity && _react.default.createElement("div", {
      className: _AppNotificationDialog.default.AppNotificationDialogDialog__SeverityIconContainer
    }, notificationOptions.severity === 'info' && _react.default.createElement(_Info.default, {
      style: iconStyle,
      nativeColor: _lightBlue.default[600]
    }), notificationOptions.severity === 'warn' && _react.default.createElement(_Warning.default, {
      style: iconStyle,
      nativeColor: _orange.default[500]
    }), notificationOptions.severity === 'error' && _react.default.createElement(_Error.default, {
      style: iconStyle,
      nativeColor: _red.default[800]
    })), _react.default.createElement("div", {
      className: _AppNotificationDialog.default.AppNotificationDialogDialog__ContentContainer
    }, message && _react.default.createElement("p", null, _react.default.createElement("strong", null, _react.default.createElement(_reactIntl.FormattedMessage, _extends({}, message, {
      values: messageValues
    })))), resolution && _react.default.createElement("p", null, _react.default.createElement(_reactIntl.FormattedMessage, _extends({}, resolution, {
      values: messageValues
    })))));
  }

  // @ts-ignore
  __reactstandin__regenerateByEval(key, code) {
    // @ts-ignore
    this[key] = eval(code);
  }

}

exports.AppNotificationDialog = AppNotificationDialog;

_defineProperty(AppNotificationDialog, "propTypes", {
  intl: _reactIntl.intlShape.isRequired,
  appNotification: _propTypes.default.objectOf(_AppNotificationRedux.Error),
  hideAppNotification: _propTypes.default.func.isRequired
});

_defineProperty(AppNotificationDialog, "defaultProps", {
  appNotification: null
});

function mapStateToProps(state) {
  return {
    appNotification: state.get('appNotification')
  };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    hideAppNotification: _AppNotificationRedux.hideAppNotification
  }, dispatch);
}

const _default = enhance(AppNotificationDialog);

var _default2 = _default;
exports.default = _default2;
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(genericMessages, "genericMessages", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationDialog.jsx");
  reactHotLoader.register(enhance, "enhance", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationDialog.jsx");
  reactHotLoader.register(AppNotificationDialog, "AppNotificationDialog", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationDialog.jsx");
  reactHotLoader.register(mapStateToProps, "mapStateToProps", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationDialog.jsx");
  reactHotLoader.register(mapDispatchToProps, "mapDispatchToProps", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationDialog.jsx");
  reactHotLoader.register(_default, "default", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationDialog.jsx");
  leaveModule(module);
})();

;