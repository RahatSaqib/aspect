import { defineMessages } from 'react-intl'

const messages = defineMessages({
  searchReports: {
    id: 'pages.ReportIndex.searchReports',
    defaultMessage: 'Search reports...',
  },
  clearSearch: {
    id: 'pages.ReportIndex.clearSearch',
    defaultMessage: 'Clear search',
  },
  requiredHint: {
    id: 'report.filterDialog.requiredHint',
    defaultMessage: 'Fill in the required fields to continue',
  },
  // The output format ("Excel"/"CSV") is interpolated rather than concatenated so
  // translations can put the verb and the format in whatever order the language needs.
  downloadFormat: {
    id: 'pages.Reports.downloadFormat',
    defaultMessage: 'Download {format}',
  },
  generateFormat: {
    id: 'pages.Reports.generateFormat',
    defaultMessage: 'Generate {format}',
  },
  processingFormat: {
    id: 'pages.Reports.processingFormat',
    defaultMessage: 'Processing {format}',
  },
})

export default messages
