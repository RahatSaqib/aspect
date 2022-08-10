import { defineMessages } from 'react-intl'

const messages = defineMessages({
  reportersTitle: {
    id: 'pages.ReporterList.reportersTitle',
    defaultMessage: 'Reporters',
  },
  siteName: {
    id: 'reporters.siteName',
    defaultMessage: 'Reporter Location',
  },
  totalResults: {
    id: 'reporters.totalResults',
    defaultMessage: 'Total Results',
  },
  delivered: {
    id: 'reporters.delivered',
    defaultMessage: 'To Reporter',
  },
  requiresTreatment: {
    id: 'reporters.requiresTreatment',
    defaultMessage: 'Requires Confirmation',
  },
  onTreatment: {
    id: 'reporters.onTreatment',
    defaultMessage: 'Confirmed',
  },
  transferred: {
    id: 'reporters.transferred',
    defaultMessage: 'Transferred Out',
  },
  notPossible: {
    id: 'reporters.notPossible',
    defaultMessage: 'Not Possible',
  },
  notOnTreatment: {
    id: 'reporters.notOnTreatment',
    defaultMessage: 'Not Confirmed',
  },
  paginatorStatus: {
    id: 'pages.ReporterList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# reporter}
      other {# reporters}
    }`,
  },
})

export default messages
