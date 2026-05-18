import { defineMessages } from 'react-intl'

const messages = defineMessages({
  reportersTitle: {
    id: 'pages.ReporterList.reportingSitesTitle',
    defaultMessage: 'Reporting Sites',
  },
  siteName: {
    id: 'reporters.siteName',
    defaultMessage: 'Reporter Location',
  },
  samplesRegistered: {
    id: 'reporters.samplesRegistered',
    defaultMessage: 'Samples Registered',
  },
  resultsReporting: {
    id: 'reporters.resultsReporting',
    defaultMessage: 'Results Reporting',
  },
  downloaded: {
    id: 'reporters.downloaded',
    defaultMessage: 'Results Downloaded',
  },
  followUpRequired: {
    id: 'reporters.followUpRequired',
    defaultMessage: 'FollowUp Required',
  },
  followUpPending: {
    id: 'reporters.followUpPending',
    defaultMessage: 'FollowUp Pending',
  },
  followUpConfirmed: {
    id: 'reporters.followUpConfirmed',
    defaultMessage: 'FollowUp Confirmed',
  },
  followUpNotPossible: {
    id: 'reporters.followUpNotPossible',
    defaultMessage: 'FollowUp Not Possible',
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
