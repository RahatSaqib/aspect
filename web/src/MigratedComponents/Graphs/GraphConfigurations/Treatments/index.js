import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import AspectDropdown from '../../../AspectDropdown'

const treatmentStatusGraphs = {
  treatmentStatus: {
    id: 'treatmentStatus',
    title: 'treatmentGraphStatusMonthly',
    componentSize: 'full',
    group: 'all',
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
        selectedValue: 'All Sites',
        endpoint: '/dashboard/site',
        state: 'siteList',
        component: AspectDropdown,
        identifier: 'siteId',
      },
      {
        selectedValue: 'Viral Load',
        endpoint: '/dashboard/site',
        state: 'assayResultCategoryList',
        component: AspectDropdown,
        identifier: 'assayTypeId',
      },
    ],
    graphRenderPermissions: ['dashboard'],
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
        displayLegend: false, // uses custom legend that can wrap
        formatDate: 'MMM yy',
      },
      {
        id: 'treatmentStatusMonthly',
        component: PieGraph,
        type: 'pieLegacyTreatment',
        size: 4,
        componentClasses: ['piegraph__container'],
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
