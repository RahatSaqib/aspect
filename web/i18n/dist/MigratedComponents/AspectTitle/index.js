"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Title = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _bind = _interopRequireDefault(require("classnames/bind"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const cssClasses = _bind.default.bind(require('./Title.css'));

const Title = ({
  icon,
  title
}) => /*#__PURE__*/_react.default.createElement("div", {
  className: cssClasses('title__container')
}, icon, /*#__PURE__*/_react.default.createElement("span", {
  className: cssClasses('title__label')
}, title));

exports.Title = Title;
Title.defaultProps = {
  icon: () => false
};
Title.defaultProps = {
  icon: _propTypes.default.func,
  title: _propTypes.default.string.isRequired
};
var _default = Title;
exports.default = _default;