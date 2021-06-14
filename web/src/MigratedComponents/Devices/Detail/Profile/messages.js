import { defineMessages } from 'react-intl'

const messages = defineMessages({
  deviceType: {
    id: 'pages.DeviceDetailProfile.deviceType',
    defaultMessage: 'Device type',
  },
  deviceLogs: {
    id: 'pages.DeviceDetailProfile.deviceLogs',
    defaultMessage: 'Device logs',
  },
  approval: {
    id: 'pages.DeviceDetailProfile.approval',
    defaultMessage: 'Approval',
  },
  calibration: {
    id: 'pages.DeviceDetailProfile.calibration',
    defaultMessage: 'Calibration',
  },
  site: {
    id: 'pages.DeviceDetailProfile.site',
    defaultMessage: 'Site',
  },
  connectivity: {
    id: 'pages.DeviceDetailProfile.connectivity',
    defaultMessage: 'Connectivity',
  },
  lastSeen: {
    id: 'pages.DeviceDetailProfile.lastSeenOn',
    defaultMessage: 'Last seen {lastSeen}',
  },
  warranty: {
    id: 'pages.DeviceDetailProfile.warranty',
    defaultMessage: 'Warranty',
  },
  utilizationRate: {
    id: 'pages.DeviceDetailProfile.utilizationRate',
    defaultMessage: 'Utilization Rate',
  },
  utilizationRateExplain: {
    id: 'pages.DeviceDetailProfile.utilizationRateExplain',
    defaultMessage:
      'Number of results in the last 30 days divided by the daily capacity of the instrument multiplied by 30 days',
  },
  errorRate: {
    id: 'pages.DeviceDetailProfile.errorRate',
    defaultMessage: 'Error Rate',
  },
  errorRateExplain: {
    id: 'pages.DeviceDetailProfile.errorRateExplain',
    defaultMessage:
      'Number of errors divided by number of results in the last 30 days',
  },
  endedOn: {
    id: 'pages.DeviceDetailProfile.endedOn',
    defaultMessage: 'Test Date',
  },
  sampleOriginSiteName: {
    id: 'pages.DeviceDetailProfile.sampleOriginSiteName',
    defaultMessage: 'Sample Collection Site',
  },
  sampleId: {
    id: 'pages.DeviceDetailProfile.sampleId',
    defaultMessage: 'Sample ID',
  },
  errorCode: {
    id: 'pages.DeviceDetailProfile.errorCode',
    defaultMessage: 'Error Code',
  },
  resultText: {
    id: 'pages.DeviceDetailProfile.resultText',
    defaultMessage: 'Result Text',
  },
  resultWorkflowStatus: {
    id: 'pages.DeviceDetailProfile.resultWorkflowStatus',
    defaultMessage: 'Result Workflow Status',
  },
  patientId: {
    id: 'pages.DeviceDetailProfile.patientId',
    defaultMessage: 'Patient ID',
  },
  paginatorStatus: {
    id: 'pages.DeviceDetailProfile.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# result}
      other {# results}
    }`,
  },
  maintenance: {
    id: 'pages.DeviceDetailProfile.maintenance',
    defaultMessage: 'Maintenance Status',
  },
  undefinedValue: {
    id: 'pages.DeviceDetailProfile.undefinedValue',
    defaultMessage: 'n/a',
  },
  notes: {
    id: 'pages.DeviceDetailProfile.notes',
    defaultMessage: 'notes',
  },
  buttonAddRecord: {
    id: 'pages.DeviceDetailProfile.buttonAddRecord',
    defaultMessage: 'Add Record',
  },
  buttonUpdate: {
    id: 'pages.DeviceDetailProfile.buttonUpdate',
    defaultMessage: 'Update',
  },
  buttonChange: {
    id: 'pages.DeviceDetailProfile.buttonChange',
    defaultMessage: 'Change',
  },
  testHistory: {
    id: 'pages.DeviceDetailProfile.testHistory',
    defaultMessage: 'Test history',
  },
  active: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.active',
    defaultMessage: 'Active',
  },
  inactiveConnectivity: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveConnectivity',
    defaultMessage: 'Connectivity',
  },
  inactiveDecommissioned: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveDecommissioned',
    defaultMessage: 'Decommissioned',
  },
  inactiveDownForRepair: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveDownForRepair',
    defaultMessage: 'Down For Repair',
  },
  inactiveNoTestsPerformed: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveNoTestsPerformed',
    defaultMessage: 'No Tests Performed',
  },
  inactiveOutOfInventory: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveOutOfInventory',
    defaultMessage: 'Out Of Inventory',
  },
  inactiveUnknown: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveUnknown',
    defaultMessage: 'Unknown',
  },
  reportedActive: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.reportedActive',
    defaultMessage: 'Active',
  },
  inactiveNoStaff: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveNoStaff',
    defaultMessage: 'No Staff',
  },
  inactiveNoSamples: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveNoSamples',
    defaultMessage: 'No Samples',
  },
  inactiveNoPower: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveNoPower',
    defaultMessage: 'No Power',
  },
  inactiveOther: {
    id: 'pages.DeviceDetailProfile.maintenanceStatus.inactiveOther',
    defaultMessage: 'Other',
  },
  deviceApprovalProvisioned: {
    id: 'pages.deviceDetail.deviceApprovalProvisioned',
    defaultMessage: 'Provisioned',
  },
  deviceApprovalAssigned: {
    id: 'pages.deviceDetail.deviceApprovalAssigned',
    defaultMessage: 'Assigned',
  },
  deviceApprovalApproved: {
    id: 'pages.deviceDetail.deviceApprovalApproved',
    defaultMessage: 'Approved',
  },
  deviceApprovalDecommissioned: {
    id: 'pages.deviceDetail.deviceApprovalDecommissioned',
    defaultMessage: 'Decommissioned',
  },
  target: {
    id: 'pages.deviceDetail.target',
    defaultMessage: 'Target',
  },
  aboveTarget: {
    id: 'pages.deviceDetail.aboveTarget',
    defaultMessage: 'Above Target',
  },
  aboveAverage: {
    id: 'pages.deviceDetail.aboveAverage',
    defaultMessage: 'Above Average',
  },
  countryAverage: {
    id: 'pages.deviceDetail.countryAverage',
    defaultMessage: 'Country Average',
  },
})

export default messages
