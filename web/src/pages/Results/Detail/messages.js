import { defineMessages } from 'react-intl'
import { resultCategory, resultCategoryType, commonDefinitions } from '../../../messages'
import resultCategoryAssayMessages from '../../../oldPages/result/list/messages'

const messagesResult = defineMessages({
  site: {
    id: 'pages.resultEdit.site',
    defaultMessage: 'Site',
  },

  resultTitle: {
    id: 'pages.resultEdit.resultTitle',
    defaultMessage: 'Result Details',
  },
  transferResult: {
    id: 'pages.resultEdit.transferResult',
    defaultMessage: 'Transfer Result',
  },
  header: {
    id: 'pages.transferResult.header',
    defaultMessage: 'Transfer Result',
  },
  titleSites: {
    id: 'pages.transferResult.titleSites',
    defaultMessage: 'Transfer to Clinic',
  },
  hint: {
    id: 'pages.transferResult.hint',
    defaultMessage: 'Enter clinic name',
  },
  enterComment: {
    id: 'pages.transferResult.enterComment',
    defaultMessage: 'Enter a comment',
  },
  buttonCancel: {
    id: 'pages.transferResult.buttonCancel',
    defaultMessage: 'Cancel',
  },
  buttonTransfer: {
    id: 'pages.transferResult.buttonTransfer',
    defaultMessage: 'Transfer',
  },
  includeAllResults: {
    id: 'pages.transferResult.includeAllResults',
    defaultMessage: 'Include ALL results related to Patient ID',
  },
  processing: {
    id: 'pages.transferResult.processing',
    defaultMessage: 'Processing...',
  },
  note: {
    id: 'pages.transferResult.note',
    defaultMessage: `
      Please notice that above field 'Transfer to Clinic' lists all clinics, even those
      which you may not have access to.
      In a such case - by transferring this result you won't
      be able to edit this result record any more, and your
      action cannot be undone.
    `,
  },
  successOk: {
    id: 'pages.transferResult.successOk',
    defaultMessage: `OK`,
  },
  successHeader: {
    id: 'pages.transferResult.successHeader',
    defaultMessage: `
      Result Transfer Completed
    `,
  },
  successMessagePatient: {
    id: 'pages.transferResult.successMessagePatient',
    defaultMessage: 'Result for patient "{patientId}" has been transferred from "{oldSiteName}" to "{newSiteName}"',
  },
  successMessageButton: {
    id: 'pages.transferResult.successMessageButton',
    defaultMessage: 'After clicking the OK button below, you will be redirected to the list of results.',
  },

  customFields: {
    id: 'pages.resultEdit.customFields',
    defaultMessage: 'Custom Fields',
  },
  noCustomFieldsDefined: {
    id: 'pages.resultEdit.noCustomFieldsDefined',
    defaultMessage: 'No Custom Fields Defined',
  },
})

export default {
  ...commonDefinitions,
  ...resultCategory,
  ...resultCategoryType,
  ...messagesResult,
  ...resultCategoryAssayMessages,
}
