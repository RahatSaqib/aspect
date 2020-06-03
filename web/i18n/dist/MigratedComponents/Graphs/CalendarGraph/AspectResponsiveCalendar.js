"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactIntl = require("react-intl");

var _calendar = require("@nivo/calendar");

var _GraphLegend = require("../GraphLegend");

var _GraphToolTip = _interopRequireDefault(require("../GraphToolTip"));

var _Formatters = require("../Helpers/Formatters");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AspectResponsiveCalendar = ({
  assaysFromState,
  culture,
  data,
  displayLegend,
  displayMethod,
  indexBy,
  keys,
  tickValuesYShape,
  tickValuesXShape,
  type
}) => {
  const {
    formatNumber: intlFormatNumber
  } = (0, _reactIntl.useIntl)();
  const legends = displayLegend ? [{
    dataFrom: 'keys',
    data: keys && keys.map(k => (0, _Formatters.generateLegend)(k, assaysFromState)),
    anchor: 'bottom-right',
    direction: 'row',
    justify: false,
    translateX: -25,
    translateY: 60,
    itemsSpacing: 2,
    itemWidth: 120,
    itemHeight: 20,
    itemDirection: 'right-to-left',
    itemOpacity: 0.85,
    symbolSize: 20,
    symbolShape: 'circle',
    effects: [{
      on: 'hover',
      style: {
        itemOpacity: 1
      }
    }]
  }] : [];
  return /*#__PURE__*/_react.default.createElement(_calendar.ResponsiveCalendar, {
    data: data,
    keys: keys,
    indexBy: indexBy,
    colorBy: "index",
    enableLabel: false,
    enableGridY: false,
    padding: 0.3,
    borderWidth: 0,
    borderColor: {
      from: 'color',
      modifiers: [['darker', 1.6]]
    },
    axisTop: null,
    axisRight: null,
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    animate: true,
    motionStiffness: 90,
    motionDamping: 15,
    layers: ['grid', 'axes', 'bars', 'markers', _GraphLegend.GraphLegend],
    colors: v => (0, _Formatters.generateColorForValue)(v),
    margin: (0, _Formatters.generateMargin)(tickValuesYShape, displayLegend),
    tooltip: v => /*#__PURE__*/_react.default.createElement(_GraphToolTip.default, {
      values: (0, _Formatters.generateToolTip)(v, culture, displayMethod, assaysFromState, intlFormatNumber)
    }),
    legends: legends
  });
};

AspectResponsiveCalendar.defaultProps = {
  tickValuesYShape: 'all',
  tickValuesXShape: 'all',
  type: 'bar'
};
AspectResponsiveCalendar.propTypes = {
  assaysFromState: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired,
  culture: _propTypes.default.string.isRequired,
  data: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired,
  displayLegend: _propTypes.default.bool.isRequired,
  displayMethod: _propTypes.default.oneOf(['percentage', 'actual']).isRequired,
  indexBy: _propTypes.default.string.isRequired,
  keys: _propTypes.default.oneOfType([_propTypes.default.array]).isRequired,
  tickValuesYShape: _propTypes.default.oneOf(['bookends', 'clubsandwich', 'all', 'none']),
  tickValuesXShape: _propTypes.default.oneOf(['bookends', 'all', 'none']),
  type: _propTypes.default.oneOf(['bar', 'stacked', 'divergent', 'barLegacyTreatment'])
};
var _default = AspectResponsiveCalendar;
exports.default = _default;