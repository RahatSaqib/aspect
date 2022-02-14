import pick from 'lodash/pick'
import map from 'lodash/map'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'

import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'
import FilterByAssayDropDown from '../../../AspectDropDown/FilterByAssayDropDown'
import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const filterMonthlyByAssaysBar = (data, props) => {
  const newData = []
  const keys = ['month']
  map(props, ({ value }) => keys.push(value))
  map(data, row => newData.push(pick(row, keys)))
  return newData
}

const filterMonthlyByAssaysPie = (data, props) => {
  const newData = []
  const keys = []
  map(props, ({ value }) => keys.push(value))
  map(keys, key => {
    const found = filter(data, { id: key })[0]
    if (!isEmpty(found)) {
      return newData.push(found)
    }
  })
  return newData
}

const testsPerFormedGraphs = {
  testsOverTime: {
    id: 'testsOverTime',
    title: 'testsOverTimeTitle',
    componentSize: 'full',
    group: 'assaysNotNeeded',
    assays: [],
    selectorModifiers: [
      {
        component: FilterByAssayDropDown,
        identifier: 'assayId',
        isClearable: true,
        isClientSide: true,
        initByCountryDefault: true,
        initByCountryDefaultGroup: 'TB',
        filterFunctions: [
          {
            id: 'testPerformedMonthlyPercentage',
            filterFunction: filterMonthlyByAssaysBar,
          },
          {
            id: 'testPerformedMonthlytotal',
            filterFunction: filterMonthlyByAssaysPie,
          },
        ],
      },
    ],
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'testPerformedMonthlyPercentage',
        component: BarGraph,
        type: 'bar',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'assay'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
          },
        },
        i18nKey: 'assayI18nKey',
        indexBy: 'month',
        keyToConsume: 'assay',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'actual',
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/result?filters=',
          keys: ['assay', 'indexBy'],
        },
      },
      {
        id: 'testPerformedMonthlytotal',
        component: PieGraph,
        type: 'pie',
        size: 4,
        componentClasses: ['piegraph__container'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'assay'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
          },
        },
        i18nKey: 'assayI18nKey',
        indexBy: 'cnt',
        keyToConsume: 'assay',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        averages: {
          showTotal: false,
          totalDisplayMethod: 'actual',
          title: 'testsOverTimeAvgTitle',
          key: '*',
          subTitle: null,
        },
      },
    ],
  },
}

export default testsPerFormedGraphs
