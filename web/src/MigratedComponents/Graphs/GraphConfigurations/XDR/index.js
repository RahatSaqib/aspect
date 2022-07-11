import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import { getTimePeriod } from '../../Helpers/Formatters'

import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../../globals/consts/Graphs/CONSTS'

import { FqrToMtbPercentageLine } from './Layers'
import AxisRightLayer from '../../BarGraph/AxisRightLayer'
import FilterByStateDropDown from '../../../AspectDropDown/FilterByStateDropDown'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS
const assays = ['GxMtbXdr']

const xdrGraphs = {
  xdrResults: {
    id: 'xdrResults',
    title: 'clinicalIndicatorsXdrTitle',
    assays,
    componentSize: 'full',
    group: 'xdr',
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'xdrByCategory1Monthly',
        component: BarGraph,
        type: 'bar',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['month', 'resultCategory2', 'resultCategory1'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
            flags: [GRAPH_CONSTS.GET_TOTAL_RESULTS],
          },
        },
        i18nKey: 'resultCategory2I18nKey',
        indexBy: 'month',
        keyToConsume: 'resultCategory2',
        filterBy: {
          resultCategory1: { values: ['Detected'] },
        },
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage',
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: {
          allow: true,
          assays,
          baseUrl: '/browse/result?filters=',
          baseAssay: assays[0],
          keys: ['resultCategoryId', 'indexBy'],
        },
      },
      {
        id: 'xdrByCategory1Aggregate',
        component: PieGraph,
        type: 'pie',
        size: 4,
        componentClasses: ['piegraph__container'],
        api: {
          endpoint: '/result/clinical-indicator-aggregations',
          params: {
            groupBy: ['resultCategory2', 'resultCategory1'],
            [MIN_DATE]: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
          },
        },
        indexBy: 'cnt',
        i18nKey: 'resultCategory2I18nKey',
        keyToConsume: 'resultCategory2',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        filterBy: {
          resultCategory1: { values: ['Detected'] },
        },
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsXdrPieLegend',
          key: ['Detected'],
        },
      },
    ],
  },

  xdrAssay: {
    id: 'xdrAssayGraph',
    title: 'xdrAssayGraphTitle',
    assays,
    componentSize: 'full',
    group: 'xdr',
    graphRenderPermissions: ['dashboard'],
    graphType: [
      {
        id: 'xdrAssayGraph',
        component: BarGraph,
        type: 'bar-line',
        size: 12,
        componentClasses: [],
        indexBy: 'month', // is used for setting jsx `key` in loops
        fields: [
          { name: 'Total', colorId: 'caseTotal', target: 'bar' },
          { name: 'MTB', colorId: '--aspect-color-slate', target: 'bar' },
          { name: 'FQR', colorId: 'caseDetected', target: 'bar' },
          {
            name: 'FQRToMTBPercentage',
            colorId: 'casePercentDetectedOfTotal',
            target: 'line',
          },
        ],
        keyToConsume: '',
        filterBy: {},
        groupMode: 'grouped',
        tickValuesYShape: 'twos',
        tickValuesXShape: 'all',
        isServerSide: true,
        layers: [FqrToMtbPercentageLine, AxisRightLayer],
        axisRightProps: {
          fieldName: 'FQRToMTBPercentage',
        },
        api: {
          endpoint: '/result/xdr-assay-graph',
          params: {
            [MIN_DATE]: '2022-01-01',
            [MAX_DATE]: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
          },
          isServerSide: true,
        },
        displayMethod: 'actual',
        displayLegend: true,
        formatDate: (v, i18n) => i18n.format(new Date(v), 'MMM-yy'),
        clickThrough: false,
      },
    ],
    selectorModifiers: [
      {
        component: FilterByStateDropDown,
        identifier: 'stateId', // for query param name
        isClearable: true,
        isClientSide: true,
        filterFunctions: [
          {
            id: 'xdrAssayGraph',
            shouldFilterOnServer: true,
          },
        ],
      },
    ],
  },
}

export default xdrGraphs
