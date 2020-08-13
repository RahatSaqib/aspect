import PieRowGraph from '../../PieRowGraph'

const resultsTransmittedGraphs = {
  resultsTransmitted: {
    id: 'resultsTransmitted',
    title: 'deviceStatusTitle',
    componentSize: 'full',
    group: 'assaysNotNeeded', // todo: add filtered assays
    assays: [
      // 'abbottM2000DBSHivVL',
      // 'abbottM2000PlasmaHivVL',
      // 'assayAlereQHiv12Detect',
      // 'assayAlereQHiv12VLPlasma',
      // 'assayCobasHivVl',
      // 'GxHiv1Vl',
      // 'GxMtbRif',
      // 'QHivVL',
      // 'ReporterHivVL',
    ],
    selectorModifiers: [],
    graphType: [
      {
        id: 'deviceStatusMonthly',
        component: PieRowGraph,
        type: 'pieRow',
        size: 12,
        componentClasses: ['piegraph__container--nobg'],
        api: {
          method: 'GET',
          endpoint: 'dashboard/results-transmitted',
          params: {}, // todo: add current month
        },
        indexBy: 'date',
        keyToConsume: 'devicesActive',
        displayMethod: 'percentage',
        formatDate: 'LLLL do',
        averages: {
          showTotal: false,
          title: 'clinicalIndicatorsPieLegend',
          key: [],
          subTitle: 'clinicalIndicatorsPieSubLegend',
        },
      },
    ],
  },
}

export default resultsTransmittedGraphs
