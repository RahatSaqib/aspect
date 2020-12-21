import PieRowGraph from '../../PieRowGraph'
import { dateRangeOptions } from '../../Helpers/Formatters/datetime'
import AspectDropDown from '../../../AspectDropDown'

import CONSTS from '../CONSTS'

const { DATE_RANGE_OPTIONS } = CONSTS
const dateRanges = dateRangeOptions()
const currentMonth =
  dateRanges[Object.keys(dateRanges)][DATE_RANGE_OPTIONS.LAST_MONTH].value
    .minDate

const resultsTransmittedGraphs = {
  resultsTransmitted: {
    id: 'resultsTransmitted',
    title: 'resultsTransmittedTitle',
    componentSize: 'row',
    group: 'assaysNotNeeded',
    assays: [],
    selectorModifiers: [
      {
        selectedValue: 'Date Range',
        endpoint: false,
        state: 'resultsDateRange',
        component: AspectDropDown,
        identifier: 'currentMonth',
        data: dateRangeOptions('resultsDateRange'),
        sortByKeys: ['id'],
        isClearable: false,
        defaultSelectedOption: DATE_RANGE_OPTIONS.LAST_MONTH,
      },
    ],
    graphRenderPermissions: ['dashboard', 'operationalData'],
    graphType: [
      {
        id: 'resultsTransmittedDials',
        component: PieRowGraph,
        type: 'pieRow',
        size: 12,
        componentClasses: ['piegraph__container--nobg'],
        api: {
          method: 'GET',
          endpoint: '/dashboard/results-transmitted',
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
