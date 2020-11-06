import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import addDays from 'date-fns/addDays'
import { formatDate } from '../../../../shared/utils/dateFormat'

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
        size: 12,
        componentClasses: ['piegraph__container--nobg'],
        api: {
          method: 'GET',
          endpoint: '/dashboard/results-transmitted',
          params: {
            currentMonth,
          },
        },
        keys: {
          assayName: true,
          cntAll: {
            linkTo: {
              url: '/browse/result',
              search: {
                filters: [
                  ['assayId', 'assayId'],
                  [
                    'minDate',
                    ({ currentMonth }) =>
                      formatDate(startOfMonth(new Date(currentMonth))),
                  ],
                  [
                    'maxDate',
                    ({ currentMonth }) =>
                      formatDate(
                        addDays(endOfMonth(new Date(currentMonth)), 1)
                      ),
                  ],
                ],
              },
            },
          },
          cntPositive: {
            linkTo: {
              url: '/browse/result',
              search: {
                filters: [
                  ['assayId', 'assayId'],
                  ['resultCategoryId', 'resultCategoryPositiveId'],
                  [
                    'minDate',
                    ({ currentMonth }) =>
                      formatDate(startOfMonth(new Date(currentMonth))),
                  ],
                  [
                    'maxDate',
                    ({ currentMonth }) =>
                      formatDate(
                        addDays(endOfMonth(new Date(currentMonth)), 1)
                      ),
                  ],
                ],
              },
            },
          },
          // cntAll: { linkTo: ['https://www.google.com'] },
          // cntPositive: { linkTo: ['https://www.google.com'] },
          percentPositive: true,
          percentReported: true,
          percentViaSms: true,
          percentViaEmail: true,
          percentWithin2Hours: true,
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
