import BarGraph from '../../BarGraph'
import PieGraph from '../../PieGraph'
import AspectDropDown from '../../../AspectDropDown'

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
        component: AspectDropDown,
        identifier: 'siteId',
      },
      {
        selectedValue: 'Viral Load',
        endpoint: '/dashboard/site',
        state: 'assayResultCategoryList',
        component: AspectDropDown,
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
          method: 'GET',
          endpoint: '/result/confirmed-treatment-tracking',
          params: {},
        },
        indexBy: 'monthTested',
        keyToConsume: 'pcOnTreatment',
        i18nKey: {
          Confirmed: 'Confirmed',
          NotConfirmed: 'NotConfirmed',
        },
        tickValuesYShape: 'none',
        tickValuesXShape: 'all',
        displayMethod: 'percentage', // todo: actual
        displayLegend: true,
        formatDate: 'MMM',
        clickThrough: {
          allow: true,
          baseUrl: '/browse/result?filters=',
          keys: ['treatmentStatus', 'indexBy'],
        },
      },
      {
        id: 'treatmentStatusMonthly',
        component: PieGraph,
        type: 'pieLegacyTreatment',
        size: 4,
        componentClasses: ['piegraph__container'],
        i18nKey: {
          Confirmed: 'Confirmed',
          NotConfirmed: 'NotConfirmed',
        },
        api: {
          method: 'GET',
          endpoint: '/result/confirmed-treatment-tracking',
          params: {},
        },
        indexBy: 'monthTested',
        keyToConsume: 'onTreatment',
        displayMethod: 'percentage',
        formatDate: 'MMM yy',
        averages: {
          showTotal: false,
          title: 'treatmentStatusTotalTitle',
          key: ['Confirmed'],
          subTitle: 'treatmentStatusTotalValidTitle',
        },
      },
    ],
  },
}

export default treatmentStatusGraphs
