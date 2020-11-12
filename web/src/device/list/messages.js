import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../shared/utils/customMessages'

export const messages = defineMessages({
  ...commonDefinitions,
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
  errorRate: {
    id: 'pages.DeviceList.errorRate',
    defaultMessage: 'Test failures',
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
  active: {
    id: 'pages.DeviceList.status.active',
    defaultMessage: 'Active',
  },
  inactiveConnectivity: {
    id: 'pages.DeviceList.status.inactiveConnectivity',
    defaultMessage: 'Connectivity',
  },
  inactiveDecommissioned: {
    id: 'pages.DeviceList.status.inactiveDecommissioned',
    defaultMessage: 'Decommissioned',
  },
  inactiveDownForRepair: {
    id: 'pages.DeviceList.status.inactiveDownForRepair',
    defaultMessage: 'Down For Repair',
  },
  inactiveNoResultsReported: {
    id: 'pages.DeviceList.status.inactiveNoResultsReported',
    defaultMessage: 'No Results Reported',
  },
  inactiveOutOfInventory: {
    id: 'pages.DeviceList.status.inactiveOutOfInventory',
    defaultMessage: 'Out Of Inventory',
  },
  inactiveUnknown: {
    id: 'pages.DeviceList.status.inactiveUnknown',
    defaultMessage: 'Unknown',
  },
  reportedActive: {
    id: 'pages.DeviceList.status.reportedActive',
    defaultMessage: 'Active',
  },
  deviceApprovalProvisioned: {
    id: 'pages.DeviceList.status.provisioned',
    defaultMessage: 'Provisioned',
  },
  deviceApprovalAssigned: {
    id: 'pages.DeviceList.status.assigned',
    defaultMessage: 'Assigned',
  },
  deviceApprovalApproved: {
    id: 'pages.DeviceList.status.approved',
    defaultMessage: 'Approved',
  },
  deviceApprovalDecommissioned: {
    id: 'pages.DeviceList.status.decommissioned',
    defaultMessage: 'Decommissioned',
  },
})

export default messages
