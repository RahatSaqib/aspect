"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _AspectResponsiveCalendar = _interopRequireDefault(require("./AspectResponsiveCalendar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CalendarGraph = ({
  data,
  keys,
  config,
  assaysFromState
}) => {
  const {
    indexBy,
    tickValuesYShape,
    tickValuesXShape,
    displayMethod,
    displayLegend,
    type
  } = config;
  return /*#__PURE__*/_react.default.createElement(_AspectResponsiveCalendar.default, {
    assaysFromState: assaysFromState,
    data: data,
    keys: keys,
    indexBy: indexBy,
    tickValuesYShape: tickValuesYShape,
    tickValuesXShape: tickValuesXShape,
    displayMethod: displayMethod,
    displayLegend: displayLegend,
    type: type
  });
};

CalendarGraph.propTypes = {
  data: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired,
  keys: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired,
  config: _propTypes.default.oneOfType([_propTypes.default.object]).isRequired,
  assaysFromState: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired
};
var _default = CalendarGraph;
exports.default = _default;