"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _BarGraph = _interopRequireDefault(require("../../BarGraph"));

var _PieGraph = _interopRequireDefault(require("../../PieGraph"));

var _CalendarGraph = _interopRequireDefault(require("../../CalendarGraph"));

var _Formatters = require("../../Helpers/Formatters");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const covidGraphs = {
  covidMortalityAndRecoveryConfig: {
    id: 'covidMortalityAndRecoveryConfig',
    title: 'covidGraphDailyMortalityAndrecovery',
    assays: ['assayGenericCovid19', 'assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19'],
    graphType: [{
      id: 'deathsPerDay',
      component: _BarGraph.default,
      type: 'bar',
      size: 6,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/follow-up-aggregations',
        params: {
          groupBy: ['day'],
          followUp: 'died',
          followUpType: 'outcome',
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'day',
      keyToConsume: 'followUp',
      displayMethod: 'actual',
      displayLegend: true,
      tickValuesYShape: 'clubsandwich',
      tickValuesXShape: 'bookends',
      formatDate: 'dd MMM'
    }, {
      id: 'recoveriesPerDay',
      component: _BarGraph.default,
      type: 'bar',
      size: 6,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/follow-up-aggregations',
        params: {
          groupBy: ['day'],
          followUp: 'recovered',
          followUpType: 'outcome',
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'day',
      keyToConsume: 'followUp',
      displayMethod: 'actual',
      displayLegend: true,
      tickValuesYShape: 'bookends',
      tickValuesXShape: 'bookends',
      formatDate: 'dd MMM'
    }]
  },
  covidCasesByAgeAndGender: {
    id: 'covidCasesByAgeAndGender',
    title: 'covidGraphDailyMortalityAndRecoveryByGenderAndGender',
    assays: ['assayGenericCovid19', 'assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19'],
    graphType: [{
      id: 'outcomeByGender',
      component: _BarGraph.default,
      type: 'divergent',
      size: 12,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/follow-up-aggregations',
        params: {
          groupBy: ['day', 'gender', 'age'],
          followUpType: 'outcome',
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'inRange',
      keyToConsume: 'gender',
      filterBy: {
        followUp: {
          values: ['died', 'recovered']
        }
      },
      tickValuesYShape: 'all',
      tickValuesXShape: 'all',
      displayMethod: 'actual',
      displayLegend: true,
      formatDate: 'dd MMM'
    }]
  },
  covidDailyConfirmed: {
    id: 'covidDailyConfirmed',
    title: 'clinicalIndicatorsCovidName',
    assays: ['assayGenericCovid19', 'assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19'],
    graphType: [{
      id: 'dailyConfirmed',
      component: _BarGraph.default,
      type: 'bar',
      size: 12,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/clinical-indicator-aggregations',
        params: {
          groupBy: ['day', 'resultCategory1'],
          minDate: (0, _Formatters.getTimePeriod)(15, 'days', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'days', 'yyyy-MM-dd')
        }
      },
      indexBy: 'day',
      keyToConsume: 'resultCategory1',
      filterBy: {
        resultCategory1: {
          values: ['Positive']
        }
      },
      tickValuesYShape: 'clubsandwich',
      tickValuesXShape: 'all',
      displayMethod: 'actual',
      displayLegend: true,
      formatDate: 'dd MMM'
    }]
  },
  covidMortalityAndRecoveryByGender: {
    id: 'covidMortalityAndRecoveryByGender',
    title: 'clinicalIndicatorsCovidGenderRecoveryRates',
    assays: ['assayGenericCovid19', 'assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19'],
    graphType: [{
      id: 'splitByFemale',
      component: _PieGraph.default,
      type: 'pie',
      size: 6,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/follow-up-aggregations',
        params: {
          groupBy: ['day', 'gender'],
          followUpType: 'outcome',
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'cnt',
      keyToConsume: 'followUp',
      filterBy: {
        followUp: {
          values: ['died', 'recovered']
        },
        gender: {
          values: ['Female']
        }
      },
      displayMethod: 'percentage',
      formatDate: 'MMM yy',
      averages: {
        showTotal: true,
        title: 'covidGraphDailyMortalityAndRecoveryByGenderTests',
        key: ['recovered'],
        subTitle: 'covidGraphDailyMortalityAndRecoveryByGenderFemale'
      }
    }, {
      id: 'splitByMale',
      component: _PieGraph.default,
      type: 'pie',
      size: 6,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/follow-up-aggregations',
        params: {
          groupBy: ['day', 'gender'],
          followUpType: 'outcome',
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'cnt',
      keyToConsume: 'followUp',
      filterBy: {
        followUp: {
          values: ['died', 'recovered']
        },
        gender: {
          values: ['Male']
        }
      },
      displayMethod: 'percentage',
      formatDate: 'MMM yy',
      averages: {
        showTotal: true,
        title: 'covidGraphDailyMortalityAndRecoveryByGenderTests',
        key: ['recovered'],
        subTitle: 'covidGraphDailyMortalityAndRecoveryByGenderMale'
      }
    }]
  },
  covidGenderByCalendar: {
    id: 'covidGenderByCalendar',
    title: 'clinicalIndicatorsCovidName',
    assays: ['assayGenericCovid19', 'assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19'],
    graphType: [{
      id: 'dailyConfirmedFemale',
      component: _CalendarGraph.default,
      type: 'calendar',
      size: 12,
      componentClasses: ['BARCLASS'],
      api: {
        endpoint: 'result/follow-up-aggregations',
        params: {
          groupBy: ['day', 'gender'],
          followUpType: 'outcome',
          minDate: (0, _Formatters.getTimePeriod)(6, 'months', 'yyyy-MM-dd'),
          maxDate: (0, _Formatters.getTimePeriod)(0, 'months', 'yyyy-MM-dd')
        }
      },
      indexBy: 'day',
      keyToConsume: 'followUp',
      filterBy: {
        gender: {
          values: ['Female']
        },
        followUp: {
          values: ['died', 'recovered']
        }
      },
      tickValuesYShape: 'clubsandwich',
      tickValuesXShape: 'all',
      displayMethod: 'actual',
      displayLegend: true,
      formatDate: 'dd MMM'
    }]
  }
};
var _default = covidGraphs;
exports.default = _default;