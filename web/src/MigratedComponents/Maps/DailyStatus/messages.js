import { defineMessages } from 'react-intl'

const messages = defineMessages({
  dailyStatusMapTitle: {
    id: 'pages.DailyStatus.dailyStatusMapTitle',
    defaultMessage: 'Current Network Status',
  },
  // map pin statuses
  active: {
    id: 'pages.DailyStatus.dailyStatusMap.active',
    defaultMessage: 'Active',
  },
  reportedActive: {
    id: 'pages.DailyStatus.dailyStatusMap.reportedActive',
    defaultMessage: 'Reported Active',
  },
  inactiveNoTestsPerformed: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveNoTestsPerformed',
    defaultMessage: 'No Tests Performed',
  },
  inactiveUnknown: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveUnknown',
    defaultMessage: 'Unknown',
  },
  inactiveOutOfInventory: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveOutOfInventory',
    defaultMessage: 'Out of Inventory',
  },
  inactiveDownForRepair: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveDownForRepair',
    defaultMessage: 'Down for Repair',
  },
  inactiveDecommissioned: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveDecommissioned',
    defaultMessage: 'Decommissioned',
  },
  inactiveNoStaff: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveNoStaff',
    defaultMessage: 'No Staff',
  },
  inactiveNoSamples: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveNoSamples',
    defaultMessage: 'No Samples',
  },
  inactiveNoPower: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveNoPower',
    defaultMessage: 'No Power',
  },
  inactiveOther: {
    id: 'pages.DailyStatus.dailyStatusMap.inactiveOther',
    defaultMessage: 'Other',
  },
  // end of map pin statuses
})

export default messages
