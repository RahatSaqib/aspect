"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AccountDetails = void 0;

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _recompose = require("recompose");

var _redux = require("redux");

var _reactHelmet = _interopRequireDefault(require("react-helmet"));

var _reactRedux = require("react-redux");

var _LinearProgress = _interopRequireDefault(require("@material-ui/core/LinearProgress"));

var _Paper = _interopRequireDefault(require("@material-ui/core/Paper"));

var _Tab = _interopRequireDefault(require("@material-ui/core/Tab"));

var _PersonPinRounded = _interopRequireDefault(require("@material-ui/icons/PersonPinRounded"));

var _Language = _interopRequireDefault(require("@material-ui/icons/Language"));

var _Lock = _interopRequireDefault(require("@material-ui/icons/Lock"));

var _AspectTabs = _interopRequireDefault(require("../../components/shared/AspectTabs"));

var _pureGrids = require("../../components/pureGrids");

var _NavTitle = _interopRequireDefault(require("../../globals/components/NavTitle"));

var _ContactDetailsForm = _interopRequireDefault(require("../../person/detail/ContactDetailsForm"));

var _LoginDetailsForm = _interopRequireDefault(require("../../person/detail/LoginDetailsForm"));

var _UserPreferencesForm = _interopRequireDefault(require("../../person/detail/UserPreferencesForm"));

var _AccountRedux = require("../AccountRedux");

var _AppNotificationRedux = require("../../appNotification/AppNotificationRedux");

var _AccountDetails = _interopRequireDefault(require("./AccountDetails.css"));

var _messages = _interopRequireDefault(require("./messages"));

var _messages2 = _interopRequireDefault(require("../../person/detail/messages"));

var _PersonRedux = require("../../person/PersonRedux");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const enhance = (0, _recompose.compose)((0, _recompose.setPropTypes)({
  location: _propTypes.default.object.isRequired,
  // eslint-disable-line
  history: _propTypes.default.object.isRequired // eslint-disable-line

}), (0, _reactRedux.connect)(state => ({
  loading: state.accountDetails.get('loading'),
  saving: state.accountDetails.get('saving'),
  accountDetails: state.accountDetails.get('data')
}), dispatch => (0, _redux.bindActionCreators)({
  showAcknowledgement: _AppNotificationRedux.showAcknowledgement,
  fetchAccountDetails: _AccountRedux.fetchAccountDetails,
  saveContactDetails: _AccountRedux.saveContactDetails,
  saveLoginDetails: _AccountRedux.saveLoginDetails,
  saveUserPreferences: _AccountRedux.saveUserPreferences
}, dispatch)), (0, _recompose.setPropTypes)({
  loading: _propTypes.default.bool.isRequired,
  saving: _propTypes.default.bool.isRequired,
  accountDetails: _propTypes.default.shape({
    contactDetails: _propTypes.default.objectOf(_PersonRedux.ContactDetails),
    loginDetails: _propTypes.default.objectOf(_PersonRedux.LoginDetails),
    userPreferences: _propTypes.default.objectOf(_PersonRedux.UserPreferences)
  }).isRequired,
  showAcknowledgement: _propTypes.default.func.isRequired,
  fetchAccountDetails: _propTypes.default.func.isRequired,
  saveContactDetails: _propTypes.default.func.isRequired,
  saveLoginDetails: _propTypes.default.func.isRequired,
  saveUserPreferences: _propTypes.default.func.isRequired
}));

class AccountDetails extends _react.PureComponent {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "state", {
      currentPasswordInputDialogOpen: false
    });

    _defineProperty(this, "openCurrentPasswordInputDialog", () => {
      this.setState({
        currentPasswordInputDialogOpen: true
      });
    });

    _defineProperty(this, "closeCurrentPasswordInputDialog", () => {
      this.setState({
        currentPasswordInputDialogOpen: false
      });
    });

    _defineProperty(this, "handleSaveContactDetails", values => this.props.saveContactDetails({
      id: this.props.accountDetails.getIn(['contactDetails', 'id']),
      name: values.name,
      title: values.title,
      email: values.email,
      email2: values.email2,
      phone: values.phone,
      cell: values.cell,
      countryId: values.countryId,
      stateId: values.stateId,
      lgaId: values.lgaId,
      zip: values.zip
    }));

    _defineProperty(this, "handleSaveLoginDetails", values => this.props.saveLoginDetails(values).then(() => {
      this.closeCurrentPasswordInputDialog();
      this.props.showAcknowledgement({
        title: _messages2.default.detailsUpdatedSuccessfully,
        message: _messages2.default.loginDetailsUpdatedMessage
      });
    }, errors => {
      if (!errors.currentPassword) {
        this.closeCurrentPasswordInputDialog();
      }
    }));

    _defineProperty(this, "handleSaveUserPreferences", values => this.props.saveUserPreferences({
      id: this.props.accountDetails.getIn(['userPreferences', 'id']),
      ...values
    }));
  }

  componentDidMount() {
    const {
      fetchAccountDetails
    } = this.props;
    fetchAccountDetails();
  } // FIXME: `incorrectCurrentPasswordEntered` is not a valid field in the `loginDetails`


  componentWillReceiveProps(newProps) {
    if (newProps.accountDetails && newProps.accountDetails.getIn(['loginDetails', 'incorrectCurrentPasswordEntered'])) {
      this.openCurrentPasswordInputDialog();
    }
  }

  render() {
    const {
      intl,
      loading,
      saving,
      accountDetails
    } = this.props;
    const {
      formatMessage
    } = intl;
    return _react.default.createElement("div", {
      className: _AccountDetails.default.Container
    }, _react.default.createElement(_reactHelmet.default, {
      title: formatMessage(_messages.default.title)
    }), _react.default.createElement(_NavTitle.default, {
      title: formatMessage(_messages.default.title)
    }), _react.default.createElement(_Paper.default, null, _react.default.createElement(_AspectTabs.default, {
      fullWidth: true
    }, _react.default.createElement(_Tab.default, {
      icon: _react.default.createElement(_PersonPinRounded.default, {
        fontSize: "large"
      }),
      label: _react.default.createElement(_pureGrids.Hidden, {
        xs: true,
        component: "span"
      }, formatMessage(_messages2.default.contactDetails))
    }, (loading || saving) && _react.default.createElement(_LinearProgress.default, null), _react.default.createElement(_pureGrids.Visible, {
      xs: true,
      component: "h2",
      className: _AccountDetails.default.Form__Header
    }, formatMessage(_messages2.default.contactDetails)), _react.default.createElement(_ContactDetailsForm.default, {
      intl: intl,
      loading: loading || saving,
      contactDetails: accountDetails.get('contactDetails'),
      onSubmit: this.handleSaveContactDetails
    })), _react.default.createElement(_Tab.default, {
      icon: _react.default.createElement(_Lock.default, {
        fontSize: "large"
      }),
      label: _react.default.createElement(_pureGrids.Hidden, {
        xs: true,
        component: "span"
      }, formatMessage(_messages.default.usernameAndPassword))
    }, (loading || saving) && _react.default.createElement(_LinearProgress.default, null), _react.default.createElement(_pureGrids.Visible, {
      xs: true,
      component: "h2",
      className: _AccountDetails.default.Form__Header
    }, formatMessage(_messages.default.usernameAndPassword)), _react.default.createElement(_LoginDetailsForm.default, {
      intl: intl,
      loading: loading || saving,
      loginDetails: accountDetails.get('loginDetails'),
      currentPasswordInputDialogOpen: this.state.currentPasswordInputDialogOpen,
      openCurrentPasswordInputDialog: this.openCurrentPasswordInputDialog,
      closeCurrentPasswordInputDialog: this.closeCurrentPasswordInputDialog,
      onSubmit: this.handleSaveLoginDetails
    })), _react.default.createElement(_Tab.default, {
      icon: _react.default.createElement(_Language.default, {
        fontSize: "large"
      }),
      label: _react.default.createElement(_pureGrids.Hidden, {
        xs: true,
        component: "span"
      }, formatMessage(_messages2.default.languageAndTimezone))
    }, (loading || saving) && _react.default.createElement(_LinearProgress.default, null), _react.default.createElement(_pureGrids.Visible, {
      xs: true,
      component: "h2",
      className: _AccountDetails.default.Form__Header
    }, formatMessage(_messages2.default.languageAndTimezone)), _react.default.createElement(_UserPreferencesForm.default, {
      intl: intl,
      loading: loading || saving,
      userPreferences: accountDetails.get('userPreferences'),
      onSubmit: this.handleSaveUserPreferences
    })))));
  }

  // @ts-ignore
  __reactstandin__regenerateByEval(key, code) {
    // @ts-ignore
    this[key] = eval(code);
  }

}

exports.AccountDetails = AccountDetails;

const _default = enhance(AccountDetails);

var _default2 = _default;
exports.default = _default2;
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(enhance, "enhance", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/detail/AccountDetails.jsx");
  reactHotLoader.register(AccountDetails, "AccountDetails", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/detail/AccountDetails.jsx");
  reactHotLoader.register(_default, "default", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/detail/AccountDetails.jsx");
  leaveModule(module);
})();

;