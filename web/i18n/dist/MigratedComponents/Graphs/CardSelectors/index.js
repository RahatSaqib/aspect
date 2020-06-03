"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _Grid = _interopRequireDefault(require("@material-ui/core/Grid"));

var _bind = _interopRequireDefault(require("classnames/bind"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const cssClasses = _bind.default.bind(require('./CardSelectors.css'));

const CardSelectors = ({
  props
}) => {
  const {
    actionComponentProps,
    action
  } = props;
  return actionComponentProps ? /*#__PURE__*/_react.default.createElement(_Grid.default, {
    container: true,
    className: cssClasses('selectors__container')
  }, actionComponentProps.map(({
    selectedValue,
    state,
    component: Component,
    identifier
  }) => {
    return /*#__PURE__*/_react.default.createElement(Component, {
      reduxStateId: state,
      selectedValue: selectedValue,
      action: action,
      identifier: identifier
    });
  })) : null;
};

var _default = CardSelectors;
exports.default = _default;