import PieRowGraph from '../../PieRowGraph'
import { dateRangeOptions } from '../../Helpers/Formatters/datetime'
import AspectDropdown from '../../../AspectDropdown'

// get previous month by default
const dateRanges = dateRangeOptions()
const currentMonth = dateRanges[Object.keys(dateRanges)][2].value.minDate

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
        component: AspectDropdown,
        identifier: 'currentMonth',
        data: dateRangeOptions('resultsDateRange'),
        sortByKeys: ['id'],
        isClearable: false,
        defaultSelectedOption: 2,
      },
    ],
    graphRenderPermissions: ['dashboard', 'operationalData'],
    graphType: [
      {
        id: 'resultsTransmittedDials',
        component: PieRowGraph,
        type: 'pieRow',
        linkRowTo: 'www.google.com',
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
