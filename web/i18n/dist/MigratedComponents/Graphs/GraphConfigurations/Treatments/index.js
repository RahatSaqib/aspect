"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _BarGraph = _interopRequireDefault(require("../../BarGraph"));

var _PieGraph = _interopRequireDefault(require("../../PieGraph"));

var _AspectDropdown = _interopRequireDefault(require("../../../AspectDropdown"));

var _Formatters = require("../../Helpers/Formatters");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const treatmentStatusGraphs = {
  treatmentStatus: {
    id: 'treatmentStatus',
    title: 'treatmentGraphStatusMonthly',
    assays: ['abbottM2000DBSHivVL', 'abbottM2000PlasmaHivVL', 'assayAlereQHiv12Detect', 'assayAlereQHiv12VLPlasma', 'assayCobasHivVl', 'GxHiv1Vl', 'QHivVL', 'ReporterHivVL'],
    selectorModifiers: [{
      selectedValue: 'All Sites',
      state: 'dashboard.siteList',
      component: _AspectDropdown.default,
      identifier: 'siteId'
    }, {
      selectedValue: 'Viral Load',
      state: 'dashboard.assayResultCategoryList',
      component: _AspectDropdown.default,
      identifier: 'assayTypeId'
    }],
    graphType: [{
      id: 'treatmentStatusMonthly',
      component: _BarGraph.default,
      type: 'barLegacyTreatment',
      size: 8,
      componentClasses: ['BARCLASS'],
      api: {
        method: 'POST',
        endpoint: 'result/confirmed-treatment-tracking',
        params: {}
      },
      indexBy: 'monthTested',
      keyToConsume: 'pcConfirmed',
      tickValuesYShape: 'none',
      tickValuesXShape: 'all',
      displayMethod: 'percentage',
      // todo: actual
      displayLegend: true,
      formatDate: 'MMM yy'
    }, {
      id: 'treatmentStatusMonthly',
      component: _PieGraph.default,
      type: 'pieLegacyTreatment',
      size: 4,
      componentClasses: ['BARCLASS'],
      api: {
        method: 'POST',
        endpoint: 'result/confirmed-treatment-tracking',
        params: {}
      },
      indexBy: 'monthTested',
      keyToConsume: 'cntConfirmed',
      displayMethod: 'percentage',
      formatDate: 'MMM yy',
      averages: {
        showTotal: true,
        title: 'treatmentStatusTotalTitle',
        key: ['Confirmed'],
        subTitle: 'treatmentStatusTotalValidTitle'
      }
    }]
  }
};
var _default = treatmentStatusGraphs;
exports.default = _default;