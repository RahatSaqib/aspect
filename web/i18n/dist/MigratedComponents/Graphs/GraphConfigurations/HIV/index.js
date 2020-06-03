"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _BarGraph = _interopRequireDefault(require("../../BarGraph"));

var _PieGraph = _interopRequireDefault(require("../../PieGraph"));

var _Formatters = require("../../Helpers/Formatters");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const hivGraphs = {
  hivResults: {
    id: 'hivResults',
    title: 'clinicalIndicatorsVLTitle',
    assays: ['abbottM2000DBSHivVL', 'abbottM2000PlasmaHivVL', 'assayAlereQHiv12Detect', 'assayAlereQHiv12VLPlasma', 'assayCobasHivVl', 'GxHiv1Vl', 'QHivVL', 'ReporterHivVL'],
    graphType: [{
      id: 'resultsByCategory1Monthly',
      component: _BarGraph.default,
      type: 'bar',
      size: 8,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/clinical-indicator-aggregations',
        params: {
          groupBy: ['month', 'resultCategory1'],
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'month',
      keyToConsume: 'resultCategory1',
      tickValuesYShape: 'none',
      tickValuesXShape: 'all',
      displayMethod: 'percentage',
      displayLegend: true,
      formatDate: 'MMM yy'
    }, {
      id: 'resultsByCategory1Aggregate',
      component: _PieGraph.default,
      type: 'pie',
      size: 4,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/clinical-indicator-aggregations',
        params: {
          groupBy: ['resultCategory1'],
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'cnt',
      keyToConsume: 'resultCategory1',
      displayMethod: 'percentage',
      formatDate: 'MMM yy',
      averages: {
        showTotal: false,
        title: 'clinicalIndicatorsPieLegend',
        key: ['NotDetected', 'LessThan1000'],
        subTitle: 'clinicalIndicatorsPieSubLegend'
      }
    }]
  }
};
var _default = hivGraphs;
exports.default = _default;