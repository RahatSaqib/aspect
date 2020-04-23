/**
 * @param  {String | Array} id The assay ID to pass to the endpoint. Can be single or multiple as array
 * @param  {String} [title] By default the title will reflect the assay name, but this can be manually set
 * @param  {String} period Period to filter result on - passed to the endpoint
 * @param  {Array} graphType Array containing config objects for all the graphs you want to display
 *
 *
 * sectionGrid
 *
 * graphType Array config:
 * @param  {String} dataKey Redux key name for state retrieval
 * @param  {Function} component Graph component you want to display
 * @param  {String} componentClass Custom classes to send along to the graph component
 * @param  {String=percentage|actual} displayMethod BarGraph only: choose to show compound stack or actual stack
 * @param  {String=resultCategory1|resultCategory2} keyToConsume Result category used by graphs to extract counts
 * @param  {String} [resultCategory1] Specific result terms to send to the endpoint for result filter
 * @param  {String} [resultCategory2] Specific result terms to send to the endpoint for result filter
 * @param  {String} indexBy Bargraph: X axes tick increments (Show each bar as day, month, week, etc)
 * @param  {String | Array} [groupBy] Optional param to be sent to endpoint for data aggregation
 * @param  {Boolean} legend Option to show the legend explanation or not
 * @param  {String} formatDate If the x axes is a date, how do you want the date displayed
 * @param  {Array} [filter] Optional to reduce the results to filter on a key on data retrieved from endpoint
 * @param  {Function} minDate Function to calc date range, needs amount, date increment (day, week, months, etc), and format
 *
 *
 * endpoint
 * followUpType
 *
 * @return {Array} Passed to ClinicalIndicatorsContainer will generate the UI
 *
 *
 *
 *
 */

import CONST from '../contstants';

const {
  DAY,
  MONTH,
  DATAKEYS,
  BarGraph,
  BARCLASS,
  BARHALFCLASS,
  CALCMETHOD,
  FOLLOWUP,
  FOLLOWUPTYPE,
  RESULT,
  PIEINDEX,
  PieGraph,
  PIECLASS,
  getDate
} = CONST;

const covidDailyConfirmedAssayConfig = {
  id: [
    'assayGenericCovid19',
    'assayGXCovid19',
    'assayMP96Covid19',
    'assayQS7Covid19'
  ],
  stateName: 'covidDailyConfirmed',
  period: DAY.plural,
  graphType: [
    {
      dataKey: DATAKEYS.stack,
      component: BarGraph,
      componentClass: BARCLASS,
      displayMethod: CALCMETHOD.actual,
      keyToConsume: RESULT.result1,
      indexBy: DAY.single,
      groupBy: [DAY.single, RESULT.result1],
      legend: false,
      formatDate: DAY.format,
      filter: ['Positive'],
      minDate: getDate(15, DAY.plural, 'yyyy-MM-dd')
    }
  ]
};

const covidDailyOutcomeAssayConfig = {
  id: [
    'assayGenericCovid19',
    'assayGXCovid19',
    'assayMP96Covid19',
    'assayQS7Covid19'
  ],
  stateName: 'covidDailyOutcome',
  period: DAY.plural,
  graphType: [
    {
      dataKey: DATAKEYS.outcomeNegative,
      endpoint: 'follow-up-aggregations',
      component: BarGraph,
      componentClass: BARHALFCLASS,
      displayMethod: CALCMETHOD.actual,
      keyToConsume: RESULT.followUp,
      followUp: FOLLOWUP.icu,
      followUpType: FOLLOWUPTYPE.treatment,
      indexBy: DAY.single,
      groupBy: [DAY.single],
      legend: true,
      formatDate: DAY.format,
      minDate: getDate(15, DAY.plural, 'yyyy-MM-dd')
    },
    {
      dataKey: DATAKEYS.outcomeRecovered,
      endpoint: 'follow-up-aggregations',
      component: BarGraph,
      componentClass: BARHALFCLASS,
      displayMethod: CALCMETHOD.actual,
      keyToConsume: RESULT.followUp,
      followUp: FOLLOWUP.self,
      followUpType: FOLLOWUPTYPE.treatment,
      indexBy: DAY.single,
      groupBy: [DAY.single],
      legend: true,
      formatDate: DAY.format,
      minDate: getDate(15, DAY.plural, 'yyyy-MM-dd')
    }
  ]
};

const covidOutcomeDistributionAssayConfig = {
  id: [
    'assayGenericCovid19',
    'assayGXCovid19',
    'assayMP96Covid19',
    'assayQS7Covid19'
  ],
  stateName: 'covidOutcomeDistributed',
  period: DAY.plural,
  /**
   * http://localhost:8080/api/result/follow-up-aggregations
   * ?groupBy=day
   * &groupBy=followUp
   * &minDate=2020-03-01
   * &followUpType=treatment
   */
  graphType: [
    {
      dataKey: DATAKEYS.outcomeDistributionStack,
      endpoint: 'follow-up-aggregations',
      component: BarGraph,
      componentClass: BARCLASS,
      displayMethod: CALCMETHOD.actual,
      keyToConsume: RESULT.followUp,
      followUpType: FOLLOWUPTYPE.treatment,
      indexBy: DAY.single,
      groupBy: [DAY.single, RESULT.followUp],
      legend: true,
      formatDate: DAY.format,
      minDate: getDate(15, DAY.plural, 'yyyy-MM-dd')
    },
    {
      dataKey: DATAKEYS.outcomeDistribution,
      endpoint: 'follow-up-aggregations',
      component: PieGraph,
      componentClass: PIECLASS,
      displayMethod: CALCMETHOD.percentage,
      keyToConsume: RESULT.followUp,
      followUpType: FOLLOWUPTYPE.treatment,
      indexBy: PIEINDEX.count,
      groupBy: [RESULT.followUp],
      legend: false,
      averages: {
        // title: intl.formatMessage(messages.clinicalIndicatorsPieLegend),
        title: '$$fix me$$',
        key: 'admissionToHospital'
      },
      minDate: getDate(5, MONTH.plural, 'yyyy-MM-dd')
    }
  ]
};

const covidRecoveryByGenderAssayConfig = {
  id: [
    'assayGenericCovid19',
    'assayGXCovid19',
    'assayMP96Covid19',
    'assayQS7Covid19'
  ],
  stateName: 'recoveryByGender',
  sectionGrid: 6,
  period: DAY.plural,
  /**
   * http://localhost:8080/api/result/follow-up-aggregations
   * ?groupBy=day
   * &groupBy=gender
   * &groupBy=followUp
   * &minDate=2020-03-01
   * &followUpType=treatment
   */
  graphType: [
    {
      dataKey: DATAKEYS.male,
      endpoint: 'follow-up-aggregations',
      component: PieGraph,
      componentClass: PIECLASS,
      displayMethod: CALCMETHOD.percentage,
      keyToConsume: RESULT.gender,
      followUp: FOLLOWUP.self,
      followUpType: FOLLOWUPTYPE.treatment,
      indexBy: PIEINDEX.count,
      groupBy: [RESULT.gender, RESULT.followUp],
      legend: false,
      averages: {
        title: 'Self Isolation',
        key: 'Male'
      },
      minDate: getDate(5, MONTH.plural, 'yyyy-MM-dd')
    },
    {
      dataKey: DATAKEYS.female,
      endpoint: 'follow-up-aggregations',
      component: PieGraph,
      componentClass: PIECLASS,
      displayMethod: CALCMETHOD.percentage,
      keyToConsume: RESULT.gender,
      followUp: FOLLOWUP.icu,
      followUpType: FOLLOWUPTYPE.treatment,
      indexBy: PIEINDEX.count,
      groupBy: [RESULT.gender, RESULT.followUp],
      legend: false,
      averages: {
        title: 'Hospitalisation (ICU)',
        key: 'Male'
      },
      minDate: getDate(5, MONTH.plural, 'yyyy-MM-dd')
    }
  ]
};

export {
  covidDailyConfirmedAssayConfig,
  covidDailyOutcomeAssayConfig,
  covidRecoveryByGenderAssayConfig,
  covidOutcomeDistributionAssayConfig
};
