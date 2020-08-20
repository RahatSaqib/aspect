import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  // groups
  summaryWidgetGroupConnectivity: {
    id: 'pages.Status.summaryWidgetGroup.connectivity',
    defaultMessage: 'Connectivity',
  },
  summaryWidgetGroupInventory: {
    id: 'pages.Status.summaryWidgetGroup.inventory',
    defaultMessage: 'Inventory',
  },
  summaryWidgetGroupDevices: {
    id: 'pages.Status.summaryWidgetGroup.devices',
    defaultMessage: 'Devices',
  },
  summaryWidgetGroupService: {
    id: 'pages.Status.summaryWidgetGroup.service',
    defaultMessage: 'Service',
  },
  dashboardWidgetTestsPerDayTitle: {
    id: 'pages.Status.dashboardWidgetTestsPerDayTitle',
    defaultMessage: 'Tests Per Day',
  },
  dashboardWidgetTestsPerDayDescription: {
    id: 'pages.Status.dashboardWidgetTestsPerDayDescription',
    defaultMessage:
      'Average number of tests per day reported the current month',
  },
  dashboardWidgetValidResultsPc: {
    id: 'pages.Status.dashboardWidgetValidResultsPc',
    defaultMessage: 'Valid Results',
  },
  dashboardWidgetValidResultsPcDescription: {
    id: 'pages.Status.dashboardWidgetValidResultsPcDescription',
    defaultMessage: 'Percentage of valid results reported the current month',
  },
})

export default messages
