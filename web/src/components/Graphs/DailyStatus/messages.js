import { defineMessages } from 'react-intl'
import deviceStatusMessages from '../../../utils/messages/deviceStatusMessages'

const messages = {
  ...deviceStatusMessages,
  ...defineMessages({
    dailyStatusMainTitle: {
      id: 'pages.DailyStatus.dailyStatusMainTitle',
      defaultMessage: 'Overall Network Health Daily',
    },
    dailyStatusToggleAll: {
      id: 'pages.DailyStatus.dailyStatusToggleAll',
      defaultMessage: 'Toggle All',
    },
    toolTipTitleResultsReported: {
      id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleResultsReported',
      defaultMessage: `{maintenanceStatusName} ({totalResults, plural,
        one {# result reported}
        other {# results reported}
      })`,
    },
    toolTipTitleWithStatus: {
      id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleWithStatus',
      defaultMessage: `{maintenanceStatusName} ({totalResults}) for {daysInSameStatus, plural,
        one {# day}
        other {# days}
      }`,
    },
    toolTipTitleWithoutStatus: {
      id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleWithoutStatus',
      defaultMessage: `{daysInSameStatus, plural,
        one {# day}
        other {# days}
      } since last update`,
    },
    toolTipLastUpdatedBy: {
      id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipLastUpdatedBy',
      defaultMessage: ` Manually set by {username} ({updatedDate})`,
    },
    toolTipTitleNotEditable: {
      id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleNotEditable',
      defaultMessage: `Can't be edited`,
    },
  }),
}

export default messages
