import PieRowGraph from '../../PieRowGraph'
import { negateTimeZoneOffset } from '../../Helpers/Formatters/datetime'

const currentMonth = negateTimeZoneOffset(new Date())

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
