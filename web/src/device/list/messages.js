import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../shared/utils/customMessages'
import deviceStatusMessages from '../../shared/messages/deviceStatusMessages'
import deviceApprovalMessages from '../../shared/messages/deviceApprovalMessages'

export const messages = {
  ...deviceStatusMessages,
  ...deviceApprovalMessages,
  ...commonDefinitions,
  ...defineMessages({
    devicesTitle: {
      id: 'pages.DeviceList.devicesTitle',
      defaultMessage: 'Devices',
    },
    device: {
      id: 'pages.DeviceList.device',
      defaultMessage: 'Device',
    },
    status: {
      id: 'pages.DeviceList.status',
      defaultMessage: 'Status',
    },
    availabilityRate: {
      id: 'pages.DeviceList.availabilityRate',
      defaultMessage: 'Active',
    },
    availabilityRateDescription: {
      id: 'pages.DeviceList.availabilityRateDescription',
      defaultMessage:
        "Based on the last 30 days, represents the percentage of days when the device was reported as 'active' compared to the total number of working days",
    },
    errorRate: {
      id: 'pages.DeviceList.errorRate',
      defaultMessage: 'Test failures',
    },
    errorRateDescription: {
      id: 'pages.DeviceList.errorRateDescription',
      defaultMessage:
        'Based on the last 30 days, represents the percentage of results with errors compared to the total number of performed results',
    },
    issues: {
      id: 'pages.DeviceList.issues',
      defaultMessage: 'Issues',
    },
    issueCategory: {
      id: 'pages.DeviceList.issueCategory',
      defaultMessage: 'Issues',
    },
    reportingFor: {
      id: 'pages.DeviceList.reportingFor',
      defaultMessage: 'Reporting Since',
    },
    lastSeen: {
      id: 'pages.DeviceList.lastSeen',
      defaultMessage: 'Last Seen',
    },
    lastSeenDescription: {
      id: 'pages.DeviceList.lastSeenDescription',
      defaultMessage: 'Represents the last time when the GxConnect application made a connection with Aspect',
    },
    numberOfTests: {
      id: 'pages.DeviceList.numberOfTests',
      defaultMessage: 'Number of Tests',
    },
    lastMonth: {
      id: 'pages.DeviceList.lastMonth',
      defaultMessage: '#Results (Preceding 30 Days)',
    },
    resultCountDescription: {
      id: 'pages.DeviceList.resultCountDescription',
      defaultMessage: 'Represents the number of results conducted from {startDate} to {endDate}',
    },
    thisMonth: {
      id: 'pages.DeviceList.thisMonth',
      defaultMessage: '#Results (Last 30 Days)',
    },
    needsRepair: {
      id: 'pages.DeviceList.needsRepair',
      defaultMessage: 'Needs Repair',
    },
    warranty: {
      id: 'pages.DeviceList.warranty',
      defaultMessage: 'Warranty',
    },
    qualityControl: {
      id: 'pages.DeviceList.qualityControl',
      defaultMessage: 'Quality Control',
    },
    connectivity: {
      id: 'pages.DeviceList.connectivity',
      defaultMessage: 'Connectivity',
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
    exportDevices: {
      id: 'pages.DeviceList.exportDevices',
      defaultMessage: 'Export device list',
    },
    reportingForDays: {
      id: 'pages.DeviceList.reportingForDays',
      defaultMessage: 'For {period}',
    },
    notAvailable: {
      id: 'pages.DeviceList.notAvailable',
      defaultMessage: 'N/A',
    },
    issueCategoryDeviceHealth: {
      id: 'pages.DeviceList.deviceHealth',
      defaultMessage: 'Device',
    },
    issueCategoryReagentHealth: {
      id: 'pages.DeviceList.reagentHealth',
      defaultMessage: 'Reagent',
    },
    issueCategoryDataHealth: {
      id: 'pages.DeviceList.dataHealth',
      defaultMessage: 'Data',
    },
    issueCategoryConnectivityHealth: {
      id: 'pages.DeviceList.connectivityHealth',
      defaultMessage: 'Connectivity',
    },
  }),
}

export default messages
