import { defineMessages } from 'react-intl'

const messagesBase = defineMessages({
  clearValue: {
    id: 'forms.formItem.clearValue',
    defaultMessage: 'Clear Value',
  },
  siteName: {
    id: 'forms.formItem.siteName',
    defaultMessage: 'Site Name',
  },
  city: {
    id: 'forms.formItem.city',
    defaultMessage: 'City',
  },
  state: {
    id: 'forms.formItem.state',
    defaultMessage: 'State',
  },
  country: {
    id: 'forms.formItem.country',
    defaultMessage: 'Country',
  },
  deviceName: {
    id: 'forms.formItem.deviceName',
    defaultMessage: 'Device Name',
  },
  deviceType: {
    id: 'forms.formItem.deviceType',
    defaultMessage: 'Device Type',
  },
  deviceSerial: {
    id: 'forms.formItem.deviceSerial',
    defaultMessage: 'Device Serial',
  },
  assay: {
    id: 'forms.formItem.assay',
    defaultMessage: 'Assay',
  },
  resultText: {
    id: 'forms.formItem.resultText',
    defaultMessage: 'Result Text',
  },
  reason: {
    id: 'forms.formItem.reason',
    defaultMessage: 'Reason',
  },
  errorCode: {
    id: 'forms.formItem.errorCode',
    defaultMessage: 'Error Code',
  },
  notes: {
    id: 'forms.formItem.notes',
    defaultMessage: 'Notes',
  },
  expectedBackOnline: {
    id: 'forms.formItem.expectedBackOnline',
    defaultMessage: 'Expected Back Online',
  },
  startDate: {
    id: 'forms.formItem.startDate',
    defaultMessage: 'Start Date',
  },
  endDate: {
    id: 'forms.formItem.endDate',
    defaultMessage: 'End Date',
  },
  timeOfTheTest: {
    id: 'forms.formItem.timeOfTheTest',
    defaultMessage: 'Time of the Test',
  },
  sampleId: {
    id: 'forms.formItem.sampleId',
    defaultMessage: 'Sample ID',
  },
  sampleType: {
    id: 'forms.formItem.sampleType',
    defaultMessage: 'Sample Type',
  },
  collectedOn: {
    id: 'forms.formItem.collectedOn',
    defaultMessage: 'Collected On',
  },
  sampleCollectionSite: {
    id: 'forms.formItem.sampleCollectionSite',
    defaultMessage: 'Sample Collection Site',
  },
  collectedBy: {
    id: 'forms.formItem.collectedBy',
    defaultMessage: 'Collected By',
  },
  reportableSite: {
    id: 'forms.formItem.reportableSite',
    defaultMessage: 'Reportable Site',
  },
  patient: {
    id: 'forms.formItem.patient',
    defaultMessage: 'Patient',
  },
  patientId: {
    id: 'forms.formItem.patientId',
    defaultMessage: 'Patient ID',
  },
  caseId: {
    id: 'forms.formItem.caseId',
    defaultMessage: 'Case ID',
  },
  technicalDetails: {
    id: 'forms.formItem.technicalDetails',
    defaultMessage: 'Technical Details',
  },
  excluded: {
    id: 'forms.formItem.excluded',
    defaultMessage: 'Excluded',
  },
  excludeReason: {
    id: 'forms.formItem.excludeReason',
    defaultMessage: 'Excluded Reason',
  },
  instrumentSerial: {
    id: 'forms.formItem.instrumentSerial',
    defaultMessage: 'Instrument Serial',
  },
  moduleName: {
    id: 'forms.formItem.moduleName',
    defaultMessage: 'Module Name',
  },
  moduleSerial: {
    id: 'forms.formItem.moduleSerial',
    defaultMessage: 'Module Serial',
  },
  consumableExpirationDate: {
    id: 'forms.formItem.consumableExpirationDate',
    defaultMessage: 'Expiration Date',
  },
  consumableLot: {
    id: 'forms.formItem.consumableLot',
    defaultMessage: 'Lot',
  },
  consumableSerial: {
    id: 'forms.formItem.consumableSerial',
    defaultMessage: 'Consumable Serial',
  },
  senderOperator: {
    id: 'forms.formItem.senderOperator',
    defaultMessage: 'Sender Operator',
  },
  addRow: {
    id: 'forms.formItem.addRow',
    defaultMessage: 'Add Row',
  },
  removeRow: {
    id: 'forms.formItem.removeRow',
    defaultMessage: 'Remove Row',
  },
  newRecurrency: {
    id: 'forms.formItem.newRecurrency',
    defaultMessage: 'New recurrency',
  },
})

const headerMessagesBase = {
  ...defineMessages({
    site: {
      id: 'forms.formSectionHeader.site',
      defaultMessage: 'Site',
    },
    device: {
      id: 'forms.formSectionHeader.device',
      defaultMessage: 'Device',
    },
    assay: {
      id: 'forms.formSectionHeader.assay',
      defaultMessage: 'Assay',
    },
    result: {
      id: 'forms.formSectionHeader.result',
      defaultMessage: 'Result',
    },
    date: {
      id: 'forms.formSectionHeader.date',
      defaultMessage: 'Date',
    },
    sample: {
      id: 'forms.formSectionHeader.sample',
      defaultMessage: 'Sample',
    },
    patient: {
      id: 'forms.formSectionHeader.patient',
      defaultMessage: 'Patient',
    },
    technicalDetails: {
      id: 'forms.formSectionHeader.technicalDetails',
      defaultMessage: 'Technical Details',
    },

    frequencyDailyPreviousCalendarDay: {
      id: 'forms.formItem.dateRange.frequencyDailyPreviousCalendarDay',
      defaultMessage: 'Previous Calendar Day',
    },
    frequencyDailyPreviousWeekDay: {
      id: 'forms.formItem.dateRange.frequencyDailyPreviousWeekDay',
      defaultMessage: 'Previous Week Day',
    },

    frequencyWeeklyPreviousWeek: {
      id: 'forms.formItem.dateRange.frequencyWeeklyPreviousWeek',
      defaultMessage: 'Previous Week',
    },
    frequencyWeeklyPrevious7Days: {
      id: 'forms.formItem.dateRange.frequencyWeeklyPrevious7Days',
      defaultMessage: 'Previous 7 Days',
    },
    frequencyMonthlyPreviousMonth: {
      id: 'forms.formItem.dateRange.frequencyMonthlyPreviousMonth',
      defaultMessage: 'Previous Month',
    },
    frequencyQuarterlyPreviousQuarter: {
      id: 'forms.formItem.dateRange.frequencyQuarterlyPreviousQuarter',
      defaultMessage: 'Previous Quarter',
    },
    frequencyYearlyPreviousYear: {
      id: 'forms.formItem.dateRange.frequencyYearlyPreviousYear',
      defaultMessage: 'Previous Year',
    },
  }),
}

export default {
  ...messagesBase,
  ...headerMessagesBase,
}
