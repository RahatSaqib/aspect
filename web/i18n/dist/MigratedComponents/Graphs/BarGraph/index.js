"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _AspectResponsiveBar = _interopRequireDefault(require("./AspectResponsiveBar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const BarGraph = ({
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
  return /*#__PURE__*/_react.default.createElement(_AspectResponsiveBar.default, {
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

BarGraph.propTypes = {
  data: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired,
  keys: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired,
  config: _propTypes.default.oneOfType([_propTypes.default.object]).isRequired,
  assaysFromState: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired
};
var _default = BarGraph;
exports.default = _default;