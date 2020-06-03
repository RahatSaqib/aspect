"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PieInnerLegend = exports.GraphLegend = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactIntl = require("react-intl");

var _legends = require("@nivo/legends");

var _bind = _interopRequireDefault(require("classnames/bind"));

var _CustomHooks = _interopRequireDefault(require("../../../Hooks/CustomHooks"));

var _Formatters = require("../Helpers/Formatters");

var _messages = _interopRequireDefault(require("../GraphsContainer/messages"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

const cssClasses = _bind.default.bind(require('./GraphLegend.css'));

const GraphLegend = ({
  height,
  legends,
  width
}) => {
  return /*#__PURE__*/_react.default.createElement(_react.Fragment, null, legends && legends.length ? legends.map(legend => /*#__PURE__*/_react.default.createElement(_legends.BoxLegendSvg, _extends({
    key: JSON.stringify(legend.data.map(({
      id
    }) => id))
  }, legend, {
    containerHeight: height,
    containerWidth: width
  }))) : null);
};

exports.GraphLegend = GraphLegend;
GraphLegend.propTypes = {
  height: _propTypes.default.string.isRequired,
  legends: _propTypes.default.bool.isRequired,
  width: _propTypes.default.string.isRequired
};

const PieInnerLegend = ({
  averages,
  data
}) => {
  const {
    formatMessage: intlFormatMessage
  } = (0, _reactIntl.useIntl)();
  const {
    title,
    key,
    subTitle,
    showTotal = false
  } = averages;
  const [average, setAverage] = (0, _react.useState)(0);
  const prevData = (0, _CustomHooks.default)(data);
  (0, _react.useEffect)(() => {
    if (!average && data || data !== prevData) {
      setAverage((0, _Formatters.getAverageFromData)(data, 'value', key));
    }
  }, [average, averages, data, key]);
  return /*#__PURE__*/_react.default.createElement("div", {
    className: cssClasses('legend__container')
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: cssClasses('legend__average'),
    style: {
      color: average.color
    }
  }, average.avg, "%"), showTotal ? /*#__PURE__*/_react.default.createElement(_react.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
    className: cssClasses('legend__subTotals')
  }, average.totals, "\xA0", intlFormatMessage(_messages.default[title])), /*#__PURE__*/_react.default.createElement("div", {
    className: cssClasses('legend__subTitle')
  }, intlFormatMessage(_messages.default[subTitle]))) : /*#__PURE__*/_react.default.createElement("div", {
    className: cssClasses('legend__title')
  }, intlFormatMessage(_messages.default[title])));
};

exports.PieInnerLegend = PieInnerLegend;
PieInnerLegend.propTypes = {
  averages: _propTypes.default.oneOfType([_propTypes.default.object]).isRequired,
  data: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired
};