import capitalize from 'lodash/capitalize'
import { getTimePeriod, buildAssaysFromWhitelist } from './Graphs/Helpers'

import messages from './messages'

const assayConfiguration = (intl, assaysFromState, BarGraph, PieGraph) => {
  /**
   * setAssays: array with config params to drive graph generation.
   * @param  {String} id The assay ID to pass to the endpoint
   * @param  {String} name Name of the disease to show
   * @param  {String} graphContainerClass Class to apply to container component
   * @param  {Array} colors colors per data point, order is important!
   * @param  {Array} orderBy Order of datapoints within the graph, order is important!
   * @param  {Array} filter Pass an array along to filter results by keys (optional)
   * @param  {Array} graphType Array of grouped graphs to generate. Order matters.
   *    @param  {String} dataKey Key to match state tree in Redux
   *    @param  {Function} component Graph component to render, passed from imports
   *    @param  {String [n='percentage']} displayMethod Accepts 'percentage': consistent height and
   *         - split by percentage and 'actual': shows actual count split (Bargraph only)
   *    @param  {String} componentClass Class you wish to apply to downstream graph
   *    @param  {String} indexBy Key in state to use as index for the graph
   *    @param  {String} resultCategory Key to match naming convention from endpoint
   *    @param  {Array} groupBy Keys to pass to endopoint for data retrieval
   *    @param  {Bool} legend Bool to show/hide graph legend (Currently Bar only)
   *    @param  {Object} averages Show/hide average message in Pie charts
   *       @param  {String} title Title of averages message
   *       @param  {String} key Key to use as count/sum for averages
   * @return {Array} Passed to ClinicalIndicatorsContainer will generate the UI
   */

  const buildAssays = []
  const CALCMETHOD = { percentage: 'percentage', actual: 'actual' }
  const BARCLASS = 'clinicalIndicators__bar'
  const PIECLASS = 'clinicalIndicators__pie'
  const PIEINDEX = { count: 'cnt' }
  const GENDER = { male: 'male', female: 'female', index: 'gender' }
  const RESULT = { result1: 'resultCategory1', result2: 'resultCategory1' }

  const DATAKEYS = {
    day: 'byDay',
    stack: 'byDayStacked',
    month: 'byMonth',
    male: 'byMale',
    female: 'byFemale',
    aggregate: 'aggregate',
  }

  const DAY = {
    single: 'day',
    plural: 'days',

    format: 'dd MMM',
    formatShort: 'dd/M',
  }

  const MONTH = {
    single: 'month',
    plural: 'months',
    format: 'MMM yyyy',
  }

  const whiteList = [
    {
      id: 'assayAspectResultEntryCovid19',
      period: DAY.plural,
      graphType: [
        {
          dataKey: DATAKEYS.day,
          filter: ['Positive'],
          component: BarGraph,
          componentClass: BARCLASS,
          displayMethod: CALCMETHOD.actual,
          resultCategory: RESULT.result1,
          indexBy: DAY.single,
          groupBy: [DAY.single, RESULT.result1],
          legend: true,
          formatDate: DAY.formatShort,
          minDate: getTimePeriod(31, DAY.plural, 'yyyy-MM-dd'),
        },
      ],
    },
    {
      id: 'assayAspectResultEntryCovid19',
      period: DAY.plural,
      graphType: [
        {
          dataKey: DATAKEYS.stack,
          component: BarGraph,
          componentClass: BARCLASS,
          displayMethod: CALCMETHOD.actual,
          resultCategory: RESULT.result1,
          indexBy: DAY.single,
          groupBy: [DAY.single, RESULT.result1],
          legend: true,
          formatDate: DAY.format,
          minDate: getTimePeriod(15, DAY.plural, 'yyyy-MM-dd'),
        },
        {
          dataKey: DATAKEYS.aggregate,
          component: PieGraph,
          componentClass: PIECLASS,
          displayMethod: CALCMETHOD.percentage,
          resultCategory: RESULT.result1,
          indexBy: PIEINDEX.count,
          groupBy: [RESULT.result1],
          legend: false,
          averages: {
            title: intl.formatMessage(
              messages.clinicalIndicators.CV.pie.legend
            ),
            key: 'Positive',
          },
          minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd'),
        },
      ],
    },
    {
      id: 'GxHiv1Vl',
      period: MONTH.plural,
      graphType: [
        {
          dataKey: DATAKEYS.month,
          component: BarGraph,
          componentClass: BARCLASS,
          displayMethod: CALCMETHOD.percentage,
          resultCategory: RESULT.result1,
          indexBy: MONTH.single,
          groupBy: [MONTH.single, RESULT.result1],
          legend: true,
          formatDate: MONTH.format,
          minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd'),
        },
        {
          dataKey: DATAKEYS.aggregate,
          component: PieGraph,
          componentClass: PIECLASS,
          displayMethod: CALCMETHOD.percentage,
          resultCategory: RESULT.result1,
          indexBy: PIEINDEX.count,
          groupBy: [RESULT.result1],
          legend: false,
          averages: {
            title: intl.formatMessage(
              messages.clinicalIndicators.HIV.pie.legend
            ),
            key: 'Not Detected',
          },
          minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd'),
        },
      ],
    },
    {
      id: 'assayAspectResultEntryCovid19',
      period: MONTH.plural,
      graphType: [
        {
          dataKey: DATAKEYS.female,
          filter: { key: 'gender', value: 'Female' },
          component: PieGraph,
          componentClass: PIECLASS,
          displayMethod: CALCMETHOD.percentage,
          resultCategory: RESULT.result1,
          indexBy: PIEINDEX.count,
          groupBy: [RESULT.result1, GENDER.index],
          legend: false,
          averages: {
            title: 'Female Recovery Rate',
            key: 'Negative',
          },
          minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd'),
        },
        {
          dataKey: DATAKEYS.male,
          filter: { key: 'gender', value: 'Male' },
          component: PieGraph,
          componentClass: PIECLASS,
          displayMethod: CALCMETHOD.percentage,
          resultCategory: RESULT.result1,
          indexBy: PIEINDEX.count,
          groupBy: [RESULT.result1, GENDER.index],
          legend: false,
          averages: {
            title: 'Male Recovery Rate',
            key: 'Negative',
          },
          minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd'),
        },
      ],
    },
  ]

  const allowedAssays = buildAssaysFromWhitelist(assaysFromState, whiteList)

  allowedAssays.map(assay => {
    const { externalId: id, name, graphType } = assay
    return buildAssays.push({
      id,
      name,
      graphContainerClass: 'clinicalIndicator__graphs',
      graphType,
      assayFromState: assay,
    })
  })

  return buildAssays
}

export default assayConfiguration
