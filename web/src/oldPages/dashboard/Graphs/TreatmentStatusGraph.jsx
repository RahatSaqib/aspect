import React from 'react'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import AspectDropDown from '../../../components/AspectDropDown'
import ErrorBoundary from '../../../components/ErrorBoundary'
import BarGraph from '../../../components/Graphs/BarGraph'
import GraphsContainer from '../../../components/Graphs/GraphsContainer'
import PieGraph from '../../../components/Graphs/PieGraph'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'

const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const treatmentStatus = {
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
  graphRenderPermissions: ['dashboard', '+reporter'],
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
        params: {
          [MIN_DATE]: startOfMonth(subMonths(new Date(), 12)),
          [MAX_DATE]: endOfMonth(subMonths(new Date(), 1)),
        },
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
      id: 'treatmentStatusMonthlyPie',
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
        params: {
          [MIN_DATE]: startOfMonth(subMonths(new Date(), 12)),
          [MAX_DATE]: endOfMonth(subMonths(new Date(), 1)),
        },
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
}

const TreatmentStatusGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={treatmentStatus.id}>
      <PermissionsProvider permissions={treatmentStatus.graphRenderPermissions}>
        <GraphsContainer assaysFromState={assays} config={treatmentStatus} />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default TreatmentStatusGraph
