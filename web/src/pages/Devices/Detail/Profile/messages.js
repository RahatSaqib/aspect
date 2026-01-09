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
    instrumentSerial: { id: 'device.instrumentList.instrumentSerial', defaultMessage: 'Instrument Serial' },
    bayNames: { id: 'device.instrumentList.bayNames', defaultMessage: 'Bay Names' },
    noInstruments: { id: 'device.instrumentList.noInstruments', defaultMessage: 'No instruments' },
    noResult: { id: 'device.instrumentList.noResult', defaultMessage: 'No result' },
    lastResultDateTooltip: {
      id: 'device.instrumentList.lastResultDateTooltip',
      defaultMessage: 'Last Result Date: {date}',
    },
  }),
}

export default messages
