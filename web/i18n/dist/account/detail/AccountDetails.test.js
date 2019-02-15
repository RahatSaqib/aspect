"use strict";

var _noop2 = _interopRequireDefault(require("lodash/noop"));

var _react = _interopRequireDefault(require("react"));

var _shallow = _interopRequireDefault(require("react-test-renderer/shallow"));

var _enzyme = require("enzyme");

var _Tab = _interopRequireDefault(require("@material-ui/core/Tab"));

var _LinearProgress = _interopRequireDefault(require("@material-ui/core/LinearProgress"));

var _AccountRedux = require("../AccountRedux");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

describe('AccountDetails module', () => {
  const {
    AccountDetails
  } = require('./AccountDetails');

  describe('AccountDetails component', () => {
    const renderer = new _shallow.default();
    const props = {
      intl: {
        formatMessage: message => message.defaultMessage
      },
      loading: false,
      saving: false,
      accountDetails: new _AccountRedux.AccountDetailsData(),
      showAcknowledgement: _noop2.default,
      fetchAccountDetails: _noop2.default,
      saveContactDetails: _noop2.default,
      saveLoginDetails: _noop2.default,
      saveUserPreferences: _noop2.default
    };
    it('should shallow render correctly', () => {
      const element = renderer.render(_react.default.createElement(AccountDetails, props));
      expect(element).toMatchSnapshot();
    });
    describe('loading status', () => {
      it('should show a progress bar in each tab', () => {
        const wrapper = (0, _enzyme.shallow)(_react.default.createElement(AccountDetails, _extends({}, props, {
          loading: true
        })));
        const results = wrapper.find(_Tab.default);
        expect(results).toHaveLength(3);
        results.forEach(w => expect(w.children().find(_LinearProgress.default)).toHaveLength(1));
      });
    });
    describe('dialog', () => {
      const saveLoginDetailsSuccess = () => Promise.resolve();

      const saveLoginDetailsWithOtherError = () => Promise.reject({
        otherError: 'other-error-message'
      }); // eslint-disable-line prefer-promise-reject-errors


      const saveLoginDetailsWithCurrentPasswordError = () => Promise.reject({
        currentPassword: 'currentPassword-error'
      }); // eslint-disable-line prefer-promise-reject-errors


      let wrapper;
      beforeEach(() => {
        wrapper = (0, _enzyme.shallow)(_react.default.createElement(AccountDetails, props));
      });
      afterEach(() => {
        wrapper = null;
      });
      it('should close the `CurrentPasswordInputDialog` when saves the login detail successfully', () => {
        wrapper.setProps({
          saveLoginDetails: saveLoginDetailsSuccess
        });
        const instance = wrapper.instance();
        instance.openCurrentPasswordInputDialog();
        expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true);
        instance.handleSaveLoginDetails().then(() => {
          expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(false);
        });
      });
      it('should not close the `CurrentPasswordInputDialog` when the error is not `currentPassword`', () => {
        wrapper.setProps({
          saveLoginDetails: saveLoginDetailsWithOtherError
        });
        const instance = wrapper.instance();
        instance.openCurrentPasswordInputDialog();
        expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true);
        instance.handleSaveLoginDetails().catch(() => {
          expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true);
        });
      });
      it('should not close the `CurrentPasswordInputDialog` when the error is `currentPassword`', () => {
        wrapper.setProps({
          saveLoginDetails: saveLoginDetailsWithCurrentPasswordError
        });
        const instance = wrapper.instance();
        instance.openCurrentPasswordInputDialog();
        expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true);
        instance.handleSaveLoginDetails().catch(() => {
          expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(false);
        });
      });
    });
    describe('lifecycle', () => {
      describe('componentDidMount', () => {
        it('should invoke `fetchAccountDetails` when the component is mounted', () => {
          const fetchAccountDetails = jest.fn();
          (0, _enzyme.shallow)(_react.default.createElement(AccountDetails, _extends({}, props, {
            fetchAccountDetails: fetchAccountDetails
          })));
          expect(fetchAccountDetails).toBeCalled();
        });
      });
    });
  });
});