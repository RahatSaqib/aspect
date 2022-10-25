import { defineMessages } from 'react-intl'
import { consumableMessages, deviceStatusMessages, commonDefinitions } from '../../../messages'

const messages = {
  ...commonDefinitions,
  ...consumableMessages,
  ...deviceStatusMessages,
  ...defineMessages({
    workloadTitle: {
      id: 'pages.workload.workloadTitle',
      defaultMessage: 'Workload',
    },
    name: {
      id: 'pages.workload.name',
      defaultMessage: 'Device Name',
    },
    deviceStatus: {
      id: 'pages.workload.deviceStatus',
      defaultMessage: 'Status',
    },
    lastPingOn: {
      id: 'pages.workload.lastPingOn',
      defaultMessage: 'Last Ping',
    },
    firstResultEndedOn: {
      id: 'pages.workload.firstResultEndedOn',
      defaultMessage: 'First Result',
    },
    lastResultEndedOn: {
      id: 'pages.workload.lastResultEndedOn',
      defaultMessage: 'Last Result',
    },
    totalTests: {
      id: 'pages.InventoryLog.totalTests',
      defaultMessage: 'Total Tests',
    },
    paginatorStatus: {
      id: 'pages.InventoryLog.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
        one {# supply}
        other {# supplies}
      }`,
    },
  }),
}

export default messages
