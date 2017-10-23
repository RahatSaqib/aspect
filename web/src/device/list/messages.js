import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  devicesTitle: {
    id: 'pages.DeviceList.devicesTitle',
    defaultMessage: 'Devices',
  },
  deviceName: {
    id: 'pages.DeviceList.deviceName',
    defaultMessage: 'Device Name',
  },
  state: {
    id: 'pages.DeviceList.state',
    defaultMessage: 'State',
  },
  status: {
    id: 'pages.DeviceList.status',
    defaultMessage: 'Status',
  },
  availabilityRate: {
    id: 'pages.DeviceList.availabilityRate',
    defaultMessage: 'Availability',
  },
  errorRate: {
    id: 'pages.DeviceList.errorRate',
    defaultMessage: 'Test failures',
  },
  issues: {
    id: 'pages.DeviceList.issues',
    defaultMessage: 'Issues',
  },
  reportingFor: {
    id: 'pages.DeviceList.reportingFor',
    defaultMessage: 'Reporting For',
  },
  lastSeen: {
    id: 'pages.DeviceList.lastSeen',
    defaultMessage: 'Last Seen',
  },
  numberOfTests: {
    id: 'pages.DeviceList.numberOfTests',
    defaultMessage: 'Number of Tests',
  },
  lastMonth: {
    id: 'pages.DeviceList.lastMonth',
    defaultMessage: 'Last Month',
  },
  thisMonth: {
    id: 'pages.DeviceList.thisMonth',
    defaultMessage: 'This Month',
  },
  availabilityOfDays: {
    id: 'pages.DeviceList.availabilityOfDays',
    defaultMessage: '{count} of {total} days',
  },
  errorOfTotal: {
    id: 'pages.DeviceList.errorOfTotal',
    defaultMessage: '{count} of {total}',
  },
  paginatorStatus: {
    id: 'pages.DeviceList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# device}
      other {# devices}
    }`,
  },
})

export default messages
