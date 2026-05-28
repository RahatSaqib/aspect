import { defineMessages } from 'react-intl'
import { commonDefinitions, deviceApprovalMessages, deviceStatusMessages } from '../../../messages'

const messages = {
  ...deviceStatusMessages,
  ...deviceApprovalMessages,
  ...commonDefinitions,
  ...defineMessages({
    devicesMergedSuccessfully: {
      id: 'pages.DeviceList.devicesMergedSuccessfully',
      defaultMessage: 'Devices merged successfully.',
    },
    devicesMergeFailed: {
      id: 'pages.DeviceList.devicesMergeFailed',
      defaultMessage: 'Failed to merge devices.',
    },
    mergeDevicesPermissionDenied: {
      id: 'pages.DeviceList.mergeDevicesPermissionDenied',
      defaultMessage: `You don't have permission to merge one or more of the selected devices.`,
    },
    mergeDevicesSourceDevicesStillActive: {
      id: 'pages.DeviceList.mergeDevicesSourceDevicesStillActive',
      defaultMessage: 'All source devices must be offline for at least 24 hours before they can be merged.',
    },
    mergeDevicesTargetIsSourceDevice: {
      id: 'pages.DeviceList.mergeDevicesTargetIsSourceDevice',
      defaultMessage: 'The target device cannot also be selected as a source device.',
    },
    mergeDevicesDifferentSites: {
      id: 'pages.DeviceList.mergeDevicesDifferentSites',
      defaultMessage: 'Only devices from the same site can be merged.',
    },
    mergeDevicesDifferentDeviceTypes: {
      id: 'pages.DeviceList.mergeDevicesDifferentDeviceTypes',
      defaultMessage: 'Only devices of the same type can be merged.',
    },
    mergeDevicesDuplicatedInstruments: {
      id: 'pages.DeviceList.mergeDevicesDuplicatedInstruments',
      defaultMessage: 'Devices cannot be merged when they contain duplicated instruments.',
    },
    button_Merge: {
      id: 'pages.DeviceList.merge',
      defaultMessage: 'Merge',
    },
    mergeDeviceActionDescription: {
      id: 'pages.DeviceList.mergeDeviceActionDescription',
      defaultMessage: `<p>Select as many devices as you want to merge, select the target device and click the Merge button.</p>
        <p><strong>The devices should be of the same Site and Device Type, and also source devices have to be offline for more than 24 Hs.<strong></p>`,
    },
    mergeDevicesConfirmationDescription: {
      id: 'pages.DeviceList.mergeDevicesConfirmationDescription',
      defaultMessage: `<p>This process will perform the following actions:</P>
      <p><br/>
        <ul>
        <li>Results not repeated between devices will moved to target device.</li>
        <li>Issues and Notifications from duplicated results will be moved to target results.</li>
        <li>Device issues not related to results, like Device Offline, will be moved to target device.</li>
        <li>Source devices will be deleted from Aspect.</li>
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
    mergingDevices: {
      id: 'pages.DeviceList.mergingDevices',
      defaultMessage: 'Merging Devices...',
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
    deviceStatusDescription: {
      id: 'pages.DeviceList.deviceStatusDescription',
      defaultMessage: `Represents the status of the testing device by evaluating its activity since the start of yesterday:
        - Up/Green: there are tests assigned to the device, or the user manually set that the device performed tests (set as Reported Active)
        - Down/Red: the user manually set that the device is down
        - Unknown/Yellow: there aren't tests registered for the device and the user didn't set any status
        - Not Recorded/Grey: something is going wrong with Aspect, because it didn't set any status - needs attention`,
    },
    connectorStatusDescription: {
      id: 'pages.DeviceList.connectorStatusDescription',
      defaultMessage: `Represents the status of the testing device connector, like GeneXpert, by evaluating the connectivity since the start of yesterday:
        - Online/Green: the connector made at least one connection with Aspect
        - Offline/Red: the connector didn't make any connections with Aspect - needs attention`,
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
      defaultMessage: '# Results Last month',
    },
    resultCountDescription: {
      id: 'pages.DeviceList.resultCountDescription',
      defaultMessage: 'Represents the number of results conducted from {startDate} to {endDate}',
    },
    thisMonth: {
      id: 'pages.DeviceList.thisMonth',
      defaultMessage: '# Results Current Month',
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
    notRecorded: {
      id: 'pages.DeviceList.notRecorded',
      defaultMessage: 'Not Recorded',
    },
  }),
}

export default messages
