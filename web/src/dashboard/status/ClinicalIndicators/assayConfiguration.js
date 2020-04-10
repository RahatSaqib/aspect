import { getTimePeriod, buildAssaysFromWhitelist } from './Graphs/Helpers'

import messages from './messages'

const assayConfiguration = (intl, assaysFromState, BarGraph, PieGraph) => {
  /**
   * @param  {String | Array} id The assay ID to pass to the endpoint. Can be single or multiple as array
   * @param  {String} [title] By default the title will reflect the assay name, but this can be manually set
   * @param  {String} period Period to filter result on - passed to the endpoint
   * @param  {Array} graphType Array containing config objects for all the graphs you want to display
   *
   * graphType Array config:
   * @param  {String} dataKey Redux key name for state retrieval
   * @param  {Function} component Graph component you want to display
   * @param  {String} componentClass Custom classes to send along to the graph component
   * @param  {String=percentage|actual} displayMethod BarGraph only: choose to show compound stack or actual stack
   * @param  {String=resultCategory1|resultCategory2} resultCategory Result catorgory to pass along to the endpoint
   * @param  {String} indexBy Bargraph: X axes tick increments (Show each bar as day, month, week, etc)
   * @param  {String | Array} [groupBy] Optional param to be sent to endpoint for data aggregation
   * @param  {Boolean} legend Option to show the legend explanation or not
   * @param  {String} formatDate If the x axes is a date, how do you want the date displayed
   * @param  {Array} [filter] Optional to reduce the results to filter on a key on data retrieved from endpoint
   * @param  {Function} minDate Function to calc date range, needs amount, date increment (day, week, months, etc), and format
   *
   * @return {Array} Passed to ClinicalIndicatorsContainer will generate the UI
   */

  const buildAssays = []
  const CALCMETHOD = {
    percentage: 'percentage',
    actual: 'actual',
  }
  const BARCLASS = 'clinicalIndicators__bar'
  const PIECLASS = 'clinicalIndicators__pie'
  const PIEINDEX = {
    count: 'cnt',
  }
  const GENDER = {
    male: 'male',
    female: 'female',
    index: 'gender',
  }
  const RESULT = {
    result1: 'resultCategory1',
    result2: 'resultCategory2',
  }

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
    formatShort: 'MMM dd',
  }

  const MONTH = {
    single: 'month',
    plural: 'months',
    format: 'MMM yyyy',
  }

  const whiteList = [
    {
      id: [
        'assayGenericCovid19',
        'assayGXCovid19',
        'assayMP96Covid19',
        'assayQS7Covid19',
      ],
      title: intl.formatMessage(messages.clinicalIndicatorsCovidName),
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
          legend: false,
          formatDate: DAY.format,
          filter: ['Positive'],
          minDate: getTimePeriod(15, DAY.plural, 'yyyy-MM-dd'),
        },
      ],
    },
    {
      id: [
        'abbottM2000DBSHivVL',
        'abbottM2000PlasmaHivVL',
        'assayAlereQHiv12Detect',
        'assayAlereQHiv12VLPlasma',
        'assayCobasHivVl',
        'GxHiv1Vl',
        'QHivVL',
        'ReporterHivVL',
      ],
      period: MONTH.plural,
      title: intl.formatMessage(messages.clinicalIndicatorsVLTitle),
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
            title: intl.formatMessage(messages.clinicalIndicatorsPieLegend),
            key: 'Not Detected',
          },
          minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd'),
        },
      ],
    },
    {
      id: ['GxMtbRif', 'GxMtbRifUltra'],
      period: MONTH.plural,
      title: intl.formatMessage(messages.clinicalIndicatorsTBTitle),
      graphType: [
        {
          dataKey: DATAKEYS.month,
          component: BarGraph,
          componentClass: BARCLASS,
          displayMethod: CALCMETHOD.actual,
          resultCategory: RESULT.result1,
          resultCategory1: 'Detected',
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
            title: intl.formatMessage(messages.clinicalIndicatorsTBPieLegend),
            key: 'Not Detected',
          },
          minDate: getTimePeriod(5, MONTH.plural, 'yyyy-MM-dd'),
        },
      ],
    },
  ]

  const allowedAssays = buildAssaysFromWhitelist(assaysFromState, whiteList)

  allowedAssays.map(assay => {
    const { externalId: id, name, title = false, graphType } = assay
    return buildAssays.push({
      id,
      name: title || name,
      graphContainerClass: 'clinicalIndicator__graphs',
      graphType,
      assayFromState: assay,
    })
  })

  return buildAssays
}

export default assayConfiguration
