import { defineMessages } from 'react-intl'

const messages = defineMessages({
  dailyStatusMainTitle: {
    id: 'pages.DailyStatus.dailyStatusMainTitle',
    defaultMessage: 'Overall Network Health Daily',
  },
  dailyStatusToggleAll: {
    id: 'pages.DailyStatus.dailyStatusToggleAll',
    defaultMessage: 'Toggle All',
  },
  active: {
    id: 'pages.DailyStatus.maintenanceStatus.active',
    defaultMessage: 'Active',
  },
  reportedActive: {
    id: 'pages.DailyStatus.maintenanceStatus.reportedActive',
    defaultMessage: 'Reported Active',
  },
  inactiveUnknown: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveUnknown',
    defaultMessage: 'Unknown',
  },
  inactiveNoResultsReported: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveNoResultsReported',
    defaultMessage: 'No Results Reported',
  },
  inactiveOutOfInventory: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveOutOfInventory',
    defaultMessage: 'Out Of Inventory',
  },
  inactiveDownForRepair: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveDownForRepair',
    defaultMessage: 'Down For Repair',
  },
  inactiveConnectivity: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveConnectivity',
    defaultMessage: 'Connectivity',
  },
  inactiveDecommissioned: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveDecommissioned',
    defaultMessage: 'Decommissioned',
  },
  inactiveNoStaff: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveNoStaff',
    defaultMessage: 'No Staff',
  },
  inactiveNoPower: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveNoPower',
    defaultMessage: 'No Power',
  },
  inactiveOther: {
    id: 'pages.DailyStatus.maintenanceStatus.inactiveOther',
    defaultMessage: 'Other',
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
})

export default messages
