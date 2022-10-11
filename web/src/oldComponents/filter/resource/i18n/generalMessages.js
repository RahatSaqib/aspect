import { defineMessages } from 'react-intl'
import { resultWorkflowStatusMessages } from '../../../../messages'

const messages = {
  ...resultWorkflowStatusMessages,
  ...defineMessages({
    ResultCategoryDetected: {
      id: 'pages.deviceDetail.ResultCategoryDetected',
      defaultMessage: 'Detected',
    },
    ResultCategoryTraceDetected: {
      id: 'pages.deviceDetail.ResultCategoryTraceDetected',
      defaultMessage: 'Trace Detected',
    },
    resultCategoryNotDetected: {
      id: 'pages.deviceDetail.resultCategoryNotDetected',
      defaultMessage: 'Not Detected',
    },
    resultCategoryIndeterminate: {
      id: 'pages.deviceDetail.resultCategoryIndeterminate',
      defaultMessage: 'Indeterminate',
    },
    resultCategoryInvalid: {
      id: 'pages.deviceDetail.resultCategoryInvalid',
      defaultMessage: 'Invalid',
    },
    resultCategoryNoResult: {
      id: 'pages.deviceDetail.resultCategoryNoResult',
      defaultMessage: 'No Result',
    },
    resultCategoryError: {
      id: 'pages.deviceDetail.resultCategoryError',
      defaultMessage: 'Error',
    },
    resultCategorySuccess: {
      id: 'pages.deviceDetail.resultCategorySuccess',
      defaultMessage: 'Success',
    },
    resultCategoryCollectNewSample: {
      id: 'pages.deviceDetail.resultCategoryCollectNewSample',
      defaultMessage: 'Collect New Sample',
    },
    resultCategoryDiscordant: {
      id: 'pages.deviceDetail.resultCategoryDiscordant',
      defaultMessage: 'Discordant',
    },
    resultCategoryLessThan40: {
      id: 'pages.deviceDetail.resultCategoryLessThan40',
      defaultMessage: '< 40 cp/mL',
    },
    resultCategoryMoreThan40: {
      id: 'pages.deviceDetail.resultCategoryMoreThan40',
      defaultMessage: '>= 40 cp/mL',
    },
    resultCategoryLessThan150: {
      id: 'pages.deviceDetail.resultCategoryLessThan150',
      defaultMessage: '< 150 cp/mL',
    },
    resultCategoryMoreThan150: {
      id: 'pages.deviceDetail.resultCategoryMoreThan150',
      defaultMessage: '>= 150 cp/mL',
    },
    resultCategoryLessThan550: {
      id: 'pages.deviceDetail.resultCategoryLessThan550',
      defaultMessage: '< 550 cp/mL',
    },
    resultCategoryMoreThan550: {
      id: 'pages.deviceDetail.resultCategoryMoreThan550',
      defaultMessage: '>= 550 cp/mL',
    },
    resultCategoryLessThan1000: {
      id: 'pages.deviceDetail.resultCategoryLessThan1000',
      defaultMessage: '< 1000 cp/mL',
    },
    resultCategoryMoreThan1000: {
      id: 'pages.deviceDetail.resultCategoryMoreThan1000',
      defaultMessage: '>= 1000 cp/mL',
    },
    resultCategoryRejected: {
      id: 'pages.deviceDetail.resultCategoryRejected',
      defaultMessage: 'Rejected',
    },
    resultCategoryMissing: {
      id: 'pages.deviceDetail.resultCategoryMissing',
      defaultMessage: 'Missing',
    },
    resultCategoryUnknown: {
      id: 'pages.deviceDetail.resultCategoryUnknown',
      defaultMessage: 'Unknown',
    },
    resultCategorySusceptible: {
      id: 'pages.deviceDetail.resultCategorySusceptible',
      defaultMessage: 'Susceptible',
    },
    resultCategoryResistant: {
      id: 'pages.deviceDetail.resultCategoryResistant',
      defaultMessage: 'Resistant',
    },
    resultCategoryNegative: {
      id: 'pages.deviceDetail.resultCategoryNegative',
      defaultMessage: 'Negative',
    },
    resultCategoryPositive1: {
      id: 'pages.deviceDetail.resultCategoryPositive1',
      defaultMessage: 'Positive (+)',
    },
    resultCategoryPositive2: {
      id: 'pages.deviceDetail.resultCategoryPositive2',
      defaultMessage: 'Positive (++)',
    },
    resultCategoryPositive3: {
      id: 'pages.deviceDetail.resultCategoryPositive3',
      defaultMessage: 'Positive (+++)',
    },
    resultCategoryScanty: {
      id: 'pages.deviceDetail.resultCategoryScanty',
      defaultMessage: 'Scanty (1-9/100)',
    },
    resultCategoryContaminated: {
      id: 'pages.deviceDetail.resultCategoryContaminated',
      defaultMessage: 'Contaminated',
    },
    resultCategoryPositiveMOTT: {
      id: 'pages.deviceDetail.resultCategoryPositiveMOTT',
      defaultMessage: 'Positive MOTT',
    },
    resultCategoryPositiveMTB: {
      id: 'pages.deviceDetail.resultCategoryPositiveMTB',
      defaultMessage: 'Positive MTB',
    },
    resultCategoryInconclusive: {
      id: 'pages.deviceDetail.resultCategoryInconclusive',
      defaultMessage: 'Inconclusive',
    },
    resultCategoryPositive: {
      id: 'pages.deviceDetail.resultCategoryPositive',
      defaultMessage: 'Positive',
    },
    resultCategoryPresumptivePositive: {
      id: 'pages.deviceDetail.resultCategoryPresumptivePositive',
      defaultMessage: 'Presumptive Positive',
    },
  }),
}

export default messages
