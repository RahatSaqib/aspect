import addMonths from 'date-fns/addMonths'
import formatISO from 'date-fns/formatISO'
import PieRowGraph from '../../PieRowGraph'
import { negateTimeZoneOffset } from '../../Helpers/Formatters/datetime'

const currentMonth = formatISO(negateTimeZoneOffset(addMonths(new Date(), -1)))

const resultsTransmittedGraphs = {
  resultsTransmitted: {
    id: 'resultsTransmitted',
    title: 'deviceStatusTitle',
    componentSize: 'row',
    group: 'assaysNotNeeded',
    assays: [
      // 'GxHiv1Vl',
      // 'GxMtbRif',
      // 'QHivVL',
      // todo: add filtered assays
    ],
    selectorModifiers: [],
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
