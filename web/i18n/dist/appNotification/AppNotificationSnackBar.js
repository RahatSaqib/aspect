"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.StyledAppNotificationSnackBar = exports.AppNotificationSnackBar = void 0;

var _flowRight2 = _interopRequireDefault(require("lodash/flowRight"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _redux = require("redux");

var _reactRedux = require("react-redux");

var _classnames = _interopRequireDefault(require("classnames"));

var _reactIntl = require("react-intl");

var _Button = _interopRequireDefault(require("@material-ui/core/Button"));

var _Snackbar = _interopRequireDefault(require("@material-ui/core/Snackbar"));

var _green = _interopRequireDefault(require("@material-ui/core/colors/green"));

var _amber = _interopRequireDefault(require("@material-ui/core/colors/amber"));

var _styles = require("@material-ui/core/styles");

var _AppNotificationRedux = require("./AppNotificationRedux");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const genericMessages = (0, _reactIntl.defineMessages)({
  title: {
    "id": "errorResponseMessages.generic.title",
    "defaultMessage": "Aspect has Encountered a Problem."
  },
  moreDetails: {
    "id": "errorResponseMessages.inline.moreDetails",
    "defaultMessage": "Details..."
  }
});
const enhance = (0, _flowRight2.default)((0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps));
const styles = {
  info: {
    color: _green.default[600]
  },
  warning: {
    color: _amber.default[700]
  }
};

class AppNotificationSnackBar extends _react.PureComponent {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "handleShowDetails", () => {
      this.props.showMoreDetails();
    });

    _defineProperty(this, "handleClose", () => {
      const onClose = this.props.appNotification.getIn(['notificationOptions', 'onClose']);

      if (onClose) {
        onClose();
      }

      if (this.props.appNotification.get('hasNotification')) {
        this.props.hideAppNotification();
      }
    });
  }

  render() {
    const {
      classes: classNameValues,
      appNotification,
      intl: {
        formatMessage
      }
    } = this.props;

    const appNotificationMessageOrDefault = (messageKey, fallbackMessage) => {
      const messageDescriptor = appNotification.getIn(['notificationOptions', messageKey]);

      if (messageDescriptor) {
        return messageDescriptor.toJS();
      }

      return fallbackMessage;
    };

    const notificationOptions = appNotification.get('notificationOptions') ? appNotification.get('notificationOptions').toJS() : {};
    const messageValues = appNotification.get('messageValues');
    const isError = appNotification.getIn(['notificationOptions', 'notificationType']) === 'error';
    const title = appNotificationMessageOrDefault('title', isError ? genericMessages.title : undefined);
    const {
      showProceed
    } = notificationOptions;
    const message = appNotificationMessageOrDefault('message', isError ? genericMessages.message : undefined);
    const resolution = appNotificationMessageOrDefault('resolution', isError ? genericMessages.resolution : undefined);
    const actionText = showProceed || message || resolution ? formatMessage(genericMessages.moreDetails) : undefined;
    const actionTouchTap = showProceed || message || resolution ? this.handleShowDetails : undefined;
    const hasNotification = appNotification.get('hasNotification');
    const showDetails = appNotification.get('showDetails');
    return _react.default.createElement(_Snackbar.default, {
      className: (0, _classnames.default)(classNameValues.fullWidth),
      open: hasNotification && !showDetails,
      message: title ? formatMessage(title, messageValues) : '',
      autoHideDuration: 4000,
      onClose: this.handleClose,
      type: isError ? 'warning' : 'accept',
      action: _react.default.createElement(_Button.default, {
        className: (0, _classnames.default)({
          [classNameValues.info]: !isError,
          [classNameValues.warning]: isError
        }),
        size: "small",
        onClick: actionTouchTap
      }, actionText ? actionText.toUpperCase() : actionText)
    });
  }

  // @ts-ignore
  __reactstandin__regenerateByEval(key, code) {
    // @ts-ignore
    this[key] = eval(code);
  }

}

exports.AppNotificationSnackBar = AppNotificationSnackBar;

_defineProperty(AppNotificationSnackBar, "propTypes", {
  intl: _reactIntl.intlShape.isRequired,
  appNotification: _propTypes.default.objectOf(_AppNotificationRedux.Error),
  classes: _propTypes.default.object.isRequired,
  // eslint-disable-line react/forbid-prop-types
  showMoreDetails: _propTypes.default.func.isRequired,
  hideAppNotification: _propTypes.default.func.isRequired
});

_defineProperty(AppNotificationSnackBar, "defaultProps", {
  appNotification: null
});

function mapStateToProps(state) {
  return {
    appNotification: state.get('appNotification')
  };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    showMoreDetails: _AppNotificationRedux.showMoreDetails,
    hideAppNotification: _AppNotificationRedux.hideAppNotification
  }, dispatch);
}

const StyledAppNotificationSnackBar = (0, _styles.withStyles)(styles)(AppNotificationSnackBar);
exports.StyledAppNotificationSnackBar = StyledAppNotificationSnackBar;

const _default = enhance(StyledAppNotificationSnackBar);

var _default2 = _default;
exports.default = _default2;
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(genericMessages, "genericMessages", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  reactHotLoader.register(enhance, "enhance", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  reactHotLoader.register(styles, "styles", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  reactHotLoader.register(AppNotificationSnackBar, "AppNotificationSnackBar", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  reactHotLoader.register(mapStateToProps, "mapStateToProps", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  reactHotLoader.register(mapDispatchToProps, "mapDispatchToProps", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  reactHotLoader.register(StyledAppNotificationSnackBar, "StyledAppNotificationSnackBar", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  reactHotLoader.register(_default, "default", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/appNotification/AppNotificationSnackBar.jsx");
  leaveModule(module);
})();

;