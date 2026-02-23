import { defineMessages } from 'react-intl'
import { deviceApprovalMessages, deviceStatusMessages } from '../../../../messages'

const messages = {
  ...deviceStatusMessages,
  ...deviceApprovalMessages,
  ...defineMessages({
    shortName: {
      id: 'pages.DeviceDetailProfile.shortName',
      defaultMessage: 'Short Name',
    },
    serial: {
      id: 'pages.DeviceDetailProfile.serial',
      defaultMessage: 'Serial No',
    },
    hostId: {
      id: 'pages.DeviceDetailProfile.hostId',
      defaultMessage: 'Host',
    },
    stickerInstrumentSerial: {
      id: 'pages.DeviceDetailProfile.stickerInstrumentSerial',
      defaultMessage: 'Sticker Instrument Serial',
    },
    instrumentModel: {
      id: 'pages.DeviceDetailProfile.instrumentModel',
      defaultMessage: 'Instrument Model',
    },
    softwareType: {
      id: 'pages.DeviceDetailProfile.softwareType',
      defaultMessage: 'Software Type',
    },
    isDaisyChained: {
      id: 'pages.DeviceDetailProfile.isDaisyChained',
      defaultMessage: 'Is Daisy Chained',
    },
    createdOn: {
      id: 'pages.DeviceDetailProfile.createdOn',
      defaultMessage: 'Created On',
    },
    deviceType: {
      id: 'pages.DeviceDetailProfile.deviceType',
      defaultMessage: 'Device type',
    },
    performanceTitle: {
      id: 'pages.DeviceDetailProfile.performanceTitle',
      defaultMessage: 'Performance',
    },
    aboveAverageUtilizationRate: {
      id: 'pages.DeviceDetailProfile.aboveAverageUtilizationRate',
      defaultMessage: 'Above Average Utilization Rate',
    },
    deviceLogs: {
      id: 'pages.DeviceDetailProfile.deviceLogs',
      defaultMessage: 'Device logs',
    },
    deviceLogsTooltip: {
      id: 'pages.DeviceDetailProfile.deviceLogsTooltip',
      defaultMessage:
        'Download all the entries that the GeneXpert device has generated in its log. In this report you can see the calibration dates, hardware/software failures and other errors, failures or information records that the device generated',
    },
    deviceStatusChangeDisabledTooltip: {
      id: 'pages.DeviceDetailProfile.deviceStatusChangeDisabledTooltip',
      defaultMessage: "Active status can't be edited",
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
    undeployed: {
      id: 'pages.DeviceDetailProfile.undeployed',
      defaultMessage: 'Undeployed',
    },
    partner: {
      id: 'pages.DeviceDetailProfile.partner',
      defaultMessage: 'Implementing Partner',
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
    percentageLegend: {
      id: 'pages.DeviceDetailProfile.percentageLegend',
      defaultMessage: 'Percentage (%)',
    },
    errorRate: {
      id: 'pages.DeviceDetailProfile.errorRate',
      defaultMessage: 'Error Rate',
    },
    aboveAverageErrorRate: {
      id: 'pages.DeviceDetailProfile.aboveAverageErrorRate',
      defaultMessage: 'Above Average Error Rate',
    },
    errorRateExplain: {
      id: 'pages.DeviceDetailProfile.errorRateExplain',
      defaultMessage: 'Number of errors divided by number of results in the last 30 days',
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
      defaultMessage: 'Result',
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
    dailyCapacity: {
      id: 'pages.DeviceDetailProfile.dailyCapacity',
      defaultMessage: 'Daily Capacity',
    },
    moduleBayCapacity: {
      id: 'pages.DeviceDetailProfile.moduleBayCapacity',
      defaultMessage: 'Module Bay Capacity',
    },
    notes: {
      id: 'pages.DeviceDetailProfile.notes',
      defaultMessage: 'Notes',
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
    target: {
      id: 'pages.deviceDetail.target',
      defaultMessage: 'Target',
    },
    aboveTarget: {
      id: 'pages.deviceDetail.aboveTarget',
      defaultMessage: 'Above Target',
    },
    average: {
      id: 'pages.deviceDetail.average',
      defaultMessage: 'Average',
    },
    aboveAverage: {
      id: 'pages.deviceDetail.aboveAverage',
      defaultMessage: 'Above Average',
    },
    countryAverage: {
      id: 'pages.deviceDetail.countryAverage',
      defaultMessage: 'Country Average',
    },
    instrumentsConnected: {
      id: 'pages.deviceDetail.instrumentsConnected',
      defaultMessage: 'Instruments Connected',
    },
    gx6cModulesCount: { id: 'pages.deviceDetail.gx6cModulesCount', defaultMessage: 'Number of GX-6C modules' },
    gx10cModulesCount: { id: 'pages.deviceDetail.gx10cModulesCount', defaultMessage: 'Number of GX-10C modules' },
    deviceCapacityModules: {
      id: 'pages.DeviceDetailProfile.deviceCapacityModules',
      defaultMessage: `{numberOfModules, plural,
        one {# module}
        other {# modules}
      }`,
    },
    tags: {
      id: 'pages.deviceDetail.tags',
      defaultMessage: 'Tags',
    },
    instrumentListTitle: { id: 'device.instrumentList.title', defaultMessage: 'Device Instruments' },
    instrumentSerial: { id: 'device.instrumentList.instrumentSerial', defaultMessage: 'Serial Number' },
    bayNames: { id: 'device.instrumentList.bayNames', defaultMessage: 'Bay Names' },
    noInstruments: { id: 'device.instrumentList.noInstruments', defaultMessage: 'No instruments' },
    noResults: { id: 'device.instrumentList.noResult', defaultMessage: 'No results' },
    lastResultDateTooltip: {
      id: 'device.instrumentList.lastResultDateTooltip',
      defaultMessage: 'Last Result Date: {date}',
    },
    joinDevicesMessage: {
      id: 'pages.DeviceDetailProfile.joinDevicesMessage',
      defaultMessage: 'There are more instruments using the same connection, are they a single device?',
    },
    joinDevicesButton: {
      id: 'pages.DeviceDetailProfile.joinDevicesButton',
      defaultMessage: 'Join Devices',
    },
    deviceName: {
      id: 'pages.DeviceDetailProfile.deviceName',
      defaultMessage: 'Device Name',
    },
    otherInstrumentsDetected: {
      id: 'pages.DeviceDetailProfile.otherInstrumentsDetected',
      defaultMessage: 'Other instruments detected ({count})',
    },
    addToThisDevice: {
      id: 'pages.DeviceDetailProfile.addToThisDevice',
      defaultMessage: 'Add to this device',
    },
    bays: {
      id: 'pages.DeviceDetailProfile.bays',
      defaultMessage: 'Bays',
    },
    geneXpertInstrumentsTooltip: {
      id: 'pages.DeviceDetailProfile.geneXpertInstrumentsTooltip',
      defaultMessage:
        'GeneXpert 16-module devices report themselves as four separate 4-module instruments. Aspect creates one device per instrument. You can configure the correct device composition here.',
    },
    instrumentsTransferredSuccessfully: {
      id: 'pages.DeviceDetailProfile.instrumentsTransferredSuccessfully',
      defaultMessage: 'Instruments transferred successfully',
    },
    instrumentsTransferFailed: {
      id: 'pages.DeviceDetailProfile.instrumentsTransferFailed',
      defaultMessage: 'Failed to transfer instruments',
    },
    moveToExistingDevice: {
      id: 'pages.DeviceDetailProfile.moveToExistingDevice',
      defaultMessage: 'Move to an existing Device',
    },
    moveToNewDevice: {
      id: 'pages.DeviceDetailProfile.moveToNewDevice',
      defaultMessage: 'Move to a new Device',
    },
    transferSuccess: {
      id: 'pages.DeviceDetailProfile.transferSuccess',
      defaultMessage: 'Instrument transferred successfully!',
    },
    transferError: {
      id: 'pages.DeviceDetailProfile.transferError',
      defaultMessage: 'Error transferring instrument.',
    },
    transferLoading: {
      id: 'pages.DeviceDetailProfile.transferLoading',
      defaultMessage: 'Transferring...',
    },
    moveToNewDeviceTitle: {
      id: 'pages.DeviceDetailProfile.moveToNewDeviceTitle',
      defaultMessage: 'Move to New Device',
    },
    cancel: {
      id: 'pages.DeviceDetailProfile.cancel',
      defaultMessage: 'Cancel',
    },
    deviceNameAlreadyExists: {
      id: 'pages.DeviceDetailProfile.deviceNameAlreadyExists',
      defaultMessage: 'Device with this name already exists',
    },
    deviceShortNameAlreadyExists: {
      id: 'pages.DeviceDetailProfile.deviceShortNameAlreadyExists',
      defaultMessage: 'Device with this short name already exists',
    },
    sitePermissionDenied: {
      id: 'pages.DeviceDetailProfile.sitePermissionDenied',
      defaultMessage: 'You do not have permission to create a device in this site',
    },
    moveToExistingDeviceTitle: {
      id: 'pages.DeviceDetailProfile.moveToExistingDeviceTitle',
      defaultMessage: 'Move to Existing Device',
    },
    device: {
      id: 'pages.DeviceDetailProfile.device',
      defaultMessage: 'Device',
    },
    targetDeviceIsSourceDevice: {
      id: 'pages.DeviceDetailProfile.targetDeviceIsSourceDevice',
      defaultMessage: 'Target device cannot be the same as the source device',
    },
    changeApprovalStatusTitle: {
      id: 'pages.DeviceDetailProfile.changeApprovalStatusTitle',
      defaultMessage: 'Change Device Status',
    },
    changeApprovalStatusConfirmation: {
      id: 'pages.DeviceDetailProfile.changeApprovalStatusConfirmation',
      defaultMessage: 'Are you sure you want to change the device status to {status}?',
    },
    changeApprovalStatusConfirm: {
      id: 'pages.DeviceDetailProfile.changeApprovalStatusConfirm',
      defaultMessage: 'Confirm',
    },
    changeApprovalStatusCancel: {
      id: 'pages.DeviceDetailProfile.changeApprovalStatusCancel',
      defaultMessage: 'Cancel',
    },
    deploymentsTitle: {
      id: 'pages.DeviceDetailProfile.deploymentsTitle',
      defaultMessage: 'Deployments',
    },
    addDeployment: {
      id: 'pages.DeviceDetailProfile.addDeployment',
      defaultMessage: 'Add Deployment',
    },
    finishDeployment: {
      id: 'pages.DeviceDetailProfile.finishDeployment',
      defaultMessage: 'Finish Deployment',
    },
    editDeployment: {
      id: 'pages.DeviceDetailProfile.editDeployment',
      defaultMessage: 'Edit',
    },
    deleteDeployment: {
      id: 'pages.DeviceDetailProfile.deleteDeployment',
      defaultMessage: 'Delete',
    },
    saveDeployments: {
      id: 'pages.DeviceDetailProfile.saveDeployments',
      defaultMessage: 'Save',
    },
    deploymentStartDate: {
      id: 'pages.DeviceDetailProfile.deploymentStartDate',
      defaultMessage: 'Start Date',
    },
    deploymentEndDate: {
      id: 'pages.DeviceDetailProfile.deploymentEndDate',
      defaultMessage: 'End Date',
    },
    deploymentSite: {
      id: 'pages.DeviceDetailProfile.deploymentSite',
      defaultMessage: 'Site',
    },
    deploymentActive: {
      id: 'pages.DeviceDetailProfile.deploymentActive',
      defaultMessage: 'Active',
    },
    deploymentSaved: {
      id: 'pages.DeviceDetailProfile.deploymentSaved',
      defaultMessage: 'Deployment changes saved successfully',
    },
    deploymentError: {
      id: 'pages.DeviceDetailProfile.deploymentError',
      defaultMessage: 'Failed to save deployment changes',
    },
    deploymentOverlap: {
      id: 'pages.DeviceDetailProfile.deploymentOverlap',
      defaultMessage:
        'Deployment periods must not overlap. Please set end dates so periods are consecutive or leave only one deployment open (active).',
    },
    deploymentOpenMustBeLast: {
      id: 'pages.DeviceDetailProfile.deploymentOpenMustBeLast',
      defaultMessage:
        'An open (active) deployment must be the last one in the timeline. Please set an end date on the deployment that should end first.',
    },
    deploymentNewStartAfterCurrentEnd: {
      id: 'pages.DeviceDetailProfile.deploymentNewStartAfterCurrentEnd',
      defaultMessage:
        'The new deployment must start after the current deployment ends. Please choose a start date on or after {minStartDate}.',
    },
    confirmDeleteDeployment: {
      id: 'pages.DeviceDetailProfile.confirmDeleteDeployment',
      defaultMessage: 'Are you sure you want to delete this deployment?',
    },
    resultsWillBeMoved: {
      id: 'pages.DeviceDetailProfile.resultsWillBeMoved',
      defaultMessage: '{count} results will be moved to {siteName}',
    },
    resultsWillLoseSite: {
      id: 'pages.DeviceDetailProfile.resultsWillLoseSite',
      defaultMessage: '{count} results between {start} and {end} will lose their site assignment',
    },
    noDeployments: {
      id: 'pages.DeviceDetailProfile.noDeployments',
      defaultMessage: 'No deployments',
    },
    finishDeploymentTitle: {
      id: 'pages.DeviceDetailProfile.finishDeploymentTitle',
      defaultMessage: 'Finish Deployment',
    },
    finishDeploymentEndNotBeforeStart: {
      id: 'pages.DeviceDetailProfile.finishDeploymentEndNotBeforeStart',
      defaultMessage: 'End date must be on or after the deployment start date.',
    },
    editDeploymentEndNotBeforeStart: {
      id: 'pages.DeviceDetailProfile.editDeploymentEndNotBeforeStart',
      defaultMessage: 'End date must be on or after the start date.',
    },
    addDeploymentTitle: {
      id: 'pages.DeviceDetailProfile.addDeploymentTitle',
      defaultMessage: 'Add Deployment',
    },
    fillGapDeploymentTitle: {
      id: 'pages.DeviceDetailProfile.fillGapDeploymentTitle',
      defaultMessage: 'Add Deployment to fill undeployed period',
    },
    fillGapDeploymentDescription: {
      id: 'pages.DeviceDetailProfile.fillGapDeploymentDescription',
      defaultMessage: 'This deployment will fill the period from {start} to {end}. Select a site.',
    },
    confirm: {
      id: 'pages.DeviceDetailProfile.confirm',
      defaultMessage: 'Confirm',
    },
    editDeploymentTitle: {
      id: 'pages.DeviceDetailProfile.editDeploymentTitle',
      defaultMessage: 'Edit Deployment',
    },
    editDeploymentOverlapWarning: {
      id: 'pages.DeviceDetailProfile.editDeploymentOverlapWarning',
      defaultMessage: 'This deployment overlaps with another deployment. The overlapping deployment will be adjusted.',
    },
    editDeploymentActiveWarning: {
      id: 'pages.DeviceDetailProfile.editDeploymentActiveWarning',
      defaultMessage:
        'There is already an active deployment. Please set an end date or finish the other deployment first.',
    },
    unassignedPeriod: {
      id: 'pages.DeviceDetailProfile.unassignedPeriod',
      defaultMessage: 'Unassigned period: {start} to {end}',
    },
    deviceUndeployed: {
      id: 'pages.DeviceDetailProfile.deviceUndeployed',
      defaultMessage: 'This device is currently undeployed. Click "Add Deployment" to assign it to a site.',
    },
    undeployedPeriod: {
      id: 'pages.DeviceDetailProfile.undeployedPeriod',
      defaultMessage: 'Undeployed',
    },
    deploymentFromBeginning: {
      id: 'pages.DeviceDetailProfile.deploymentFromBeginning',
      defaultMessage: '—',
    },
    deploymentTimelineAriaLabel: {
      id: 'pages.DeviceDetailProfile.deploymentTimelineAriaLabel',
      defaultMessage: 'Deployment timeline by site',
    },
    deploymentAddClosesActive: {
      id: 'pages.DeviceDetailProfile.deploymentAddClosesActive',
      defaultMessage: 'The current {site} deployment will end on {date}.',
    },
    deploymentEditAdjustsPrev: {
      id: 'pages.DeviceDetailProfile.deploymentEditAdjustsPrev',
      defaultMessage: 'The previous {site} deployment will end on {date}.',
    },
    deploymentDeleteMiddle: {
      id: 'pages.DeviceDetailProfile.deploymentDeleteMiddle',
      defaultMessage:
        'Deleting this deployment will extend the {prevSite} deployment to cover the period up to {date}.',
    },
    deploymentDeleteFirst: {
      id: 'pages.DeviceDetailProfile.deploymentDeleteFirst',
      defaultMessage: 'The {nextSite} deployment will become the first (covering from the beginning).',
    },
    deploymentDeleteLast: {
      id: 'pages.DeviceDetailProfile.deploymentDeleteLast',
      defaultMessage: 'The {prevSite} deployment will become the active one.',
    },
    deploymentDeleteOnly: {
      id: 'pages.DeviceDetailProfile.deploymentDeleteOnly',
      defaultMessage: 'This will remove all deployments from this device.',
    },
    deploymentNotConsecutive: {
      id: 'pages.DeviceDetailProfile.deploymentNotConsecutive',
      defaultMessage: 'Deployments must form a continuous timeline with no gaps.',
    },
  }),
}

export default messages
