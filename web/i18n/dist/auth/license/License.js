"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.License = void 0;

var _get2 = _interopRequireDefault(require("lodash/get"));

var _omit2 = _interopRequireDefault(require("lodash/omit"));

var _flowRight2 = _interopRequireDefault(require("lodash/flowRight"));

var _bind = _interopRequireDefault(require("classnames/bind"));

var _react = _interopRequireDefault(require("react"));

var _recompose = require("recompose");

var _redux = require("redux");

var _reactIntl = require("react-intl");

var _reactRedux = require("react-redux");

var _Button = _interopRequireDefault(require("@material-ui/core/Button"));

var _Card = _interopRequireDefault(require("@material-ui/core/Card"));

var _reactHelmet = _interopRequireDefault(require("react-helmet"));

var _pureGrids = require("../../components/pureGrids");

var _AuthRedux = require("../AuthRedux");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

const cssClasses = _bind.default.bind(require('./License.css'));

const messages = (0, _reactIntl.defineMessages)({
  title: {
    "id": "pages.License.title",
    "defaultMessage": "License"
  },
  accept: {
    "id": "pages.License.accept",
    "defaultMessage": "I Accept"
  },
  doNotAccept: {
    "id": "pages.License.doNotAccept",
    "defaultMessage": "I Do Not Accept"
  }
});
const enhance = (0, _recompose.compose)((0, _reactRedux.connect)(state => ({
  hasToAcceptLicenseId: state.user.jwt.hasToAcceptLicenseId,
  licenseContent: state.user.licenseContent
}), _redux.bindActionCreators.bind(null, {
  fetchLicense: _AuthRedux.fetchLicense,
  userRequestedLogout: _AuthRedux.userRequestedLogout,
  acceptLicenseStart: _AuthRedux.acceptLicenseStart
})), (0, _recompose.withHandlers)({
  onInitialLoad: ({
    hasToAcceptLicenseId,
    fetchLicense
  }) => () => {
    fetchLicense(hasToAcceptLicenseId);
  },
  onAcceptClick: ({
    history,
    location,
    acceptLicenseStart,
    hasToAcceptLicenseId
  }) => () => {
    acceptLicenseStart(hasToAcceptLicenseId).then(() => {
      const referrer = (0, _flowRight2.default)(x => (0, _omit2.default)(x, 'search'), x => (0, _get2.default)(x, 'state.referrer', {
        pathname: '/'
      }))(location);
      history.push(referrer);
    });
  },
  onDoNotAcceptClick: ({
    userRequestedLogout
  }) => () => {
    userRequestedLogout();
  }
}), (0, _recompose.lifecycle)({
  componentDidMount() {
    this.props.onInitialLoad();
  }

}));

const AspectLogo = () => _react.default.createElement("img", {
  className: cssClasses('Logo__Image'),
  src: require('../logo_aspect.png'),
  alt: "Aspect"
});

const License = ({
  intl,
  licenseContent,
  onDoNotAcceptClick,
  onAcceptClick
}) => _react.default.createElement("div", {
  className: cssClasses('Background')
}, _react.default.createElement(_reactHelmet.default, {
  title: "License"
}), _react.default.createElement("div", null, _react.default.createElement(_pureGrids.Unit, {
  sm: "1-24",
  md: "1-12",
  lg: "1-12",
  xl: "1-6"
}), _react.default.createElement(_pureGrids.Unit, {
  sm: "11-12",
  md: "5-6",
  lg: "5-6",
  xl: "2-3"
}, _react.default.createElement(_Card.default, null, _react.default.createElement("div", {
  className: cssClasses('Logo__Container')
}, _react.default.createElement(AspectLogo, null)), _react.default.createElement("div", {
  className: cssClasses('License__Container')
}, _react.default.createElement("div", {
  className: cssClasses('License__Container__License')
}, licenseContent && licenseContent.split('\n') // eslint-disable-next-line react/no-array-index-key
.map((item, key) => _react.default.createElement("p", {
  key: key
}, item))), _react.default.createElement("div", {
  className: cssClasses('License__Container__ActionRow')
}, _react.default.createElement(_Button.default, {
  type: "submit",
  variant: "contained",
  color: "primary",
  onClick: onAcceptClick
}, intl.formatMessage(messages.accept)), _react.default.createElement(_Button.default, {
  type: "submit",
  variant: "contained",
  onClick: onDoNotAcceptClick
}, intl.formatMessage(messages.doNotAccept))))))));

exports.License = License;

const _default = enhance(License);

var _default2 = _default;
exports.default = _default2;
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(cssClasses, "cssClasses", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/license/License.jsx");
  reactHotLoader.register(messages, "messages", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/license/License.jsx");
  reactHotLoader.register(enhance, "enhance", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/license/License.jsx");
  reactHotLoader.register(AspectLogo, "AspectLogo", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/license/License.jsx");
  reactHotLoader.register(License, "License", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/license/License.jsx");
  reactHotLoader.register(_default, "default", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/auth/license/License.jsx");
  leaveModule(module);
})();

;