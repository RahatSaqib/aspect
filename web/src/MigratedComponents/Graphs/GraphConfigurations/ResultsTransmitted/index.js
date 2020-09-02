import addMonths from 'date-fns/addMonths'
import formatISO from 'date-fns/formatISO'
import PieRowGraph from '../../PieRowGraph'
import {
  negateTimeZoneOffset,
  dateRangeOptions,
} from '../../Helpers/Formatters/datetime'
import AspectDropdown from '../../../AspectDropdown'

const currentMonth = formatISO(negateTimeZoneOffset(addMonths(new Date(), -1)))

const resultsTransmittedGraphs = {
  resultsTransmitted: {
    id: 'resultsTransmitted',
    title: 'resultsTransmittedTitle',
    componentSize: 'row',
    group: 'assaysNotNeeded',
    assays: [
      // 'GxHiv1Vl',
      // 'GxMtbRif',
      // 'QHivVL',
      // todo: add filtered assays
    ],
    selectorModifiers: [
      {
        selectedValue: 'Date Range',
        endpoint: false,
        state: 'resultsDateRange',
        component: AspectDropdown,
        identifier: 'currentMonth',
        data: dateRangeOptions('resultsDateRange'),
        sortByKeys: ['id'],
      },
    ],
    graphType: [
      {
        id: 'resultsTransmittedDials',
        component: PieRowGraph,
        type: 'pieRow',
        size: 12,
        componentClasses: ['piegraph__container--nobg'],
        api: {
          method: 'GET',
          endpoint: 'dashboard/results-transmitted',
          params: {
            currentMonth,
          },
        },
        indexBy: 'date',
        keyToConsume: 'devicesActive',
        displayMethod: 'percentage',
        formatDate: 'LLLL do',
      },
    ],
  },
}

export default resultsTransmittedGraphs
