import { defineMessages } from 'react-intl'

export const messages = defineMessages({
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
  dashboardWidgetSmsSentTitle: {
    id: 'pages.Status.dashboardWidgetSmsSentTitle',
    defaultMessage: 'SMS Sent MTD',
  },
  dashboardWidgetSmsSentDescription: {
    id: 'pages.Status.dashboardWidgetSmsSentDescription',
    defaultMessage: 'The total number of text messages sent in the month',
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
