import PieRowGraph from '../../PieRowGraph'
import { dateRangeOptions } from '../../Helpers/Formatters'
import AspectDropDown from '../../../AspectDropDown'

import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'

const {
  DATE_RANGE_OPTIONS,
  DATE_RANGE_KEYS: { CURRENT_MONTH },
} = DATE_CONSTS
const dateRanges = dateRangeOptions('resultsDateRange', false)
const currentMonth = dateRanges.resultsDateRange.find(dr => dr.id === DATE_RANGE_OPTIONS.CURRENT_MONTH).value.minDate

const resultsTransmittedGraphs = () => ({
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
        defaultSelectedOption: DATE_RANGE_OPTIONS.CURRENT_MONTH,
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
            [CURRENT_MONTH]: currentMonth,
          },
        },
        indexBy: 'date',
        keyToConsume: 'devicesActive',
        displayMethod: 'percentage',
        formatDate: 'LLLL do',
      },
    ],
  },
})

export default resultsTransmittedGraphs
