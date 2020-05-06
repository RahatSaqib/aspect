import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import AspectDropdown from '../../../AspectDropdown'
import { getTimePeriod } from '../../Helpers/Formatters'

const treatmentStatusGraphs = {
  treatmentStatus: {
    id: 'treatmentStatus',
    title: 'treatmentGraphStatusMonthly',
    assays: [
      'abbottM2000DBSHivVL',
      'abbottM2000PlasmaHivVL',
      'assayAlereQHiv12Detect',
      'assayAlereQHiv12VLPlasma',
      'assayCobasHivVl',
      'GxHiv1Vl',
      'QHivVL',
      'ReporterHivVL',
    ],
    selectorModifiers: [
      {
        id: 'Viral Load',
        state: 'dashboard.assayResultCategoryList',
        component: AspectDropdown,
      },
    ],
    graphType: [
      {
        id: 'treatmentStatusMonthly',
        component: BarGraph,
        type: 'barLegacyTreatment',
        size: 8,
        componentClasses: ['BARCLASS'],
        api: {
          method: 'POST',
          endpoint: 'result/confirmed-treatment-tracking',
          params: {},
        },
        indexBy: 'monthTested',
        keyToConsume: 'pcConfirmed',
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage', // todo: actual
        displayLegend: true,
        formatDate: 'MMM yy',
      },
      {
        id: 'treatmentStatusAggregate',
        component: PieGraph,
        type: 'pieLegacyTreatment',
        size: 4,
        componentClasses: ['BARCLASS'],
        api: {
          method: 'POST',
          endpoint: 'result/confirmed-treatment-tracking',
          params: {},
        },
        indexBy: 'monthTested',
        keyToConsume: 'cntConfirmed',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        averages: {
          showTotal: true,
          title: 'treatmentStatusTotalTitle',
          key: ['Confirmed'],
          subTitle: 'treatmentStatusTotalValidTitle',
        },
      },
    ],
  },
}

export default treatmentStatusGraphs
