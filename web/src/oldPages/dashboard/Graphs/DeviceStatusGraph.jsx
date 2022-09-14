import React from 'react'
import AspectDropDown from '../../../components/AspectDropDown'
import ErrorBoundary from '../../../components/ErrorBoundary'
import BarGraph from '../../../components/Graphs/BarGraph'
import GraphsContainer from '../../../components/Graphs/GraphsContainer'
import { getPreviousPeriod, dateRangeOptions } from '../../../components/Graphs/Helpers/Formatters'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'

const {
  DATE_RANGE_OPTIONS,
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const deviceStatus = {
  id: 'deviceStatus',
  title: 'deviceStatusTitle',
  componentSize: 'full',
  group: 'assaysNotNeeded',
  assays: [],
  selectorModifiers: [
    {
      selectedValue: 'Date Range',
      endpoint: false,
      state: 'deviceDateRange',
      component: AspectDropDown,
      identifier: 'dateRange',
      data: dateRangeOptions('deviceDateRange'),
      sortByKeys: ['id'],
      isClearable: false,
      defaultSelectedOption: DATE_RANGE_OPTIONS.LAST_MONTH,
    },
  ],
  graphRenderPermissions: ['dashboard', 'operationalData'],
  graphType: [
    {
      id: 'deviceStatusMonthly',
      component: BarGraph,
      type: 'stackedDeviceActivity',
      size: 12,
      componentClasses: ['BARCLASS'],
      i18nKey: {
        devicesActive: 'devicesActive',
        devicesInactive: 'devicesInactive',
        inactiveUnknown: 'inactiveUnknown',
        inactiveNoTestsPerformed: 'inactiveNoTestsPerformed',
        inactiveOutOfInventory: 'inactiveOutOfInventory',
        inactiveDownForRepair: 'inactiveDownForRepair',
        inactiveConnectivity: 'inactiveConnectivity',
        inactiveDecommissioned: 'inactiveDecommissioned',
        weekendOrHoliday: 'weekendOrHoliday',
        inactiveNoStaff: 'inactiveNoStaff',
        inactiveNoSamples: 'inactiveNoSamples',
        inactiveNoPower: 'inactiveNoPower',
        inactiveOther: 'inactiveOther',
      },
      api: {
        method: 'GET',
        endpoint: '/dashboard/operational-data/activity-over-time',
        params: {
          [MIN_DATE]: getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").start,
          [MAX_DATE]: getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").end,
        },
      },
      indexBy: 'date',
      keyToConsume: 'devicesActive',
      legendsToPopover: [
        {
          externalId: 'inactiveUnknown',
          tooltip: {
            show: true,
            placement: 'top',
            message: 'statusUnknownLegend',
          },
        },
      ],
      legendsNotToRender: ['inactiveDecommissioned'],
      tickValuesYShape: 'clubsandwich',
      tickValuesXShape: 'all',
      displayMethod: 'percentage',
      displayLegend: true,
      formatDate: 'LLLL do',
    },
  ],
}

const DeviceStatusGraph = ({ assays }) => {
  return (
    <ErrorBoundary key={deviceStatus.id}>
      <PermissionsProvider permissions={deviceStatus.graphRenderPermissions}>
        <GraphsContainer assaysFromState={assays} config={deviceStatus} />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default DeviceStatusGraph
