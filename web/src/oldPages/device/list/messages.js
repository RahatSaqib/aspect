import { defineMessages } from 'react-intl'
import deviceApprovalMessages from '../../../utils/messages/deviceApprovalMessages'
import deviceStatusMessages from '../../../utils/messages/deviceStatusMessages'
import { commonDefinitions } from '../../../utils/utils/customMessages'

export const messages = {
  ...deviceStatusMessages,
  ...deviceApprovalMessages,
  ...commonDefinitions,
  ...defineMessages({
    button_Merge: {
      id: 'pages.DeviceList.merge',
      defaultMessage: 'Merge',
    },
    mergeDeviceActionDescription: {
      id: 'pages.DeviceList.mergeDeviceActionDescription',
      defaultMessage: `<p>Select as many devices as you want to merge, select the target device and click the Merge button.</p>
        <p><strong>The devices should be of the same Site and Device Type, and also source devices have to be offline for more than 24 Hs.<strong></p>`,
    },
    mergeDevicesConfirmationTitle: {
      id: 'pages.DeviceList.mergeDevicesConfirmationTitle',
      defaultMessage: `<p>This process will perform the following actions:</P>
      <p><br/>
        <ul>
        <li>• Results not repeated between devices will moved to target device.</li>
        <li>• Issues and Notifications from duplicated results will be moved to target results.</li>
        <li>• Device issues not related to results, like inventory issues, will be moved to target device.</li>
        <li>• Source devices will be deleted from Aspect.</li>
        <ul>
      </p>
      <br/>
      <p style="color: red;">
        **IMPORTANT:** This action is unreversible!
      </p>
      `,
    },
    confirmToProceed: {
      id: 'pages.DeviceList.areYouSure',
      defaultMessage: 'Confirm to proceed.',
    },
    buttonConfirmMerge: {
      id: 'pages.DeviceList.buttonConfirmMerge',
      defaultMessage: 'Confirm',
    },
    devicesTitle: {
      id: 'pages.DeviceList.devicesTitle',
      defaultMessage: 'Devices',
    },
    sourceDevices: {
      id: 'pages.DeviceList.sourceDevices',
      defaultMessage: 'Source devices',
    },
    targetDevice: {
      id: 'pages.DeviceList.targetDevice',
      defaultMessage: 'Target device',
    },
    mergeDevices: {
      id: 'pages.DeviceList.mergeDevices',
      defaultMessage: 'Merge Devices',
    },
    device: {
      id: 'pages.DeviceList.device',
      defaultMessage: 'Device',
    },
    site: {
      id: 'pages.DeviceList.site',
      defaultMessage: 'Site',
    },
    maintenanceStatus: {
      id: 'pages.DeviceList.maintenanceStatus',
      defaultMessage: 'Maintenance Status',
    },
    approvalStatus: {
      id: 'pages.DeviceList.approvalStatus',
      defaultMessage: 'Approval Status',
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
      defaultMessage: 'Represents the last time when the connector application made a connection with Aspect',
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
    connectorStatus: {
      id: 'pages.DeviceList.connectorStatus',
      defaultMessage: 'Connector Status',
    },
    connectorVersion: {
      id: 'pages.DeviceList.connectorVersion',
      defaultMessage: 'Connector Version',
    },
    lastResultConductedOn: {
      id: 'pages.DeviceList.lastResultConductedOn',
      defaultMessage: 'Last Result Conducted On',
    },
    deviceStatus: {
      id: 'pages.DeviceList.deviceStatus',
      defaultMessage: 'Device Status',
    },
    online: {
      id: 'pages.DeviceList.online',
      defaultMessage: 'Online',
    },
    offline: {
      id: 'pages.DeviceList.offline',
      defaultMessage: 'Offline',
    },
    up: {
      id: 'pages.DeviceList.up',
      defaultMessage: 'Up',
    },
    down: {
      id: 'pages.DeviceList.down',
      defaultMessage: 'Down',
    },
    unknown: {
      id: 'pages.DeviceList.unknown',
      defaultMessage: 'Unknown',
    },
  }),
}

export default messages
