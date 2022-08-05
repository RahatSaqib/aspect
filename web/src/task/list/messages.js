import { defineMessages } from 'react-intl'

const messages = defineMessages({
  tasksTitle: {
    id: 'pages.TaskList.title',
    defaultMessage: 'Tasks',
  },

  alertCount: {
    id: 'pages.TaskList.alertCount',
    defaultMessage: `{alertCount, plural,
      one {# alert}
      other {# alerts}
    }`,
  },
  issueStatusInactive: {
    id: 'pages.TaskList.issueStatusInactive',
    defaultMessage: 'Inactive',
  },
  issueStatusActive: {
    id: 'pages.TaskList.issueStatusActive',
    defaultMessage: 'Active',
  },
  issueStatusAcknowledged: {
    id: 'pages.TaskList.issueStatusAcknowledged',
    defaultMessage: 'Acknowledged',
  },
  issueStatusOK: { id: 'pages.TaskList.issueStatusOK', defaultMessage: 'OK' },
  issueStatusDueSoon: {
    id: 'pages.TaskList.issueStatusDueSoon',
    defaultMessage: 'Due Soon',
  },
  issueStatusDueNow: {
    id: 'pages.TaskList.issueStatusDueNow',
    defaultMessage: 'Due Now',
  },
  issueStatusOverdue: {
    id: 'pages.TaskList.issueStatusOverdue',
    defaultMessage: 'Overdue',
  },
  issueStatusResolved: {
    id: 'pages.TaskList.issueStatusResolved',
    defaultMessage: 'Resolved',
  },
  issueCategoryDeviceHealth: {
    id: 'pages.TaskList.issueCategoryDeviceHealth',
    defaultMessage: 'Device Health',
  },
  DeviceHealth: {
    id: 'pages.TaskList.DeviceHealth',
    defaultMessage: 'Device Health',
  },
  issueCategoryReagentHealth: {
    id: 'pages.TaskList.issueCategoryReagentHealth',
    defaultMessage: 'Reagent Health',
  },
  ReagentHealth: {
    id: 'pages.TaskList.ReagentHealth',
    defaultMessage: 'Reagent Health',
  },
  issueCategoryDataHealth: {
    id: 'pages.TaskList.issueCategoryDataHealth',
    defaultMessage: 'Data Health',
  },
  DataHealth: {
    id: 'pages.TaskList.dataHealth',
    defaultMessage: 'Data Health',
  },
  issueCategoryConnectivityHealth: {
    id: 'pages.TaskList.issueCategoryConnectivityHealth',
    defaultMessage: 'Connectivity Health',
  },
  ConnectivityHealth: {
    id: 'pages.TaskList.ConnectivityHealth',
    defaultMessage: 'Connectivity Health',
  },
  taskListOptionsAllTopics: {
    id: 'pages.TaskList.taskListOptionsAllTopics',
    defaultMessage: 'All topics',
  },
  taskListOptionsDevice: {
    id: 'pages.TaskList.taskListOptionsDevice',
    defaultMessage: 'Device',
  },
  taskListOptionsReagent: {
    id: 'pages.TaskList.taskListOptionsReagent',
    defaultMessage: 'Reagent',
  },
  taskListOptionsData: {
    id: 'pages.TaskList.taskListOptionsData',
    defaultMessage: 'Data',
  },
  taskListOptionsConnectivity: {
    id: 'pages.TaskList.taskListOptionsConnectivity',
    defaultMessage: 'Connectivity',
  },
  taskAggreTitle: {
    id: 'pages.TaskAggre.title',
    defaultMessage: 'Task',
  },
  topic: {
    id: 'pages.TaskList.topic',
    defaultMessage: 'Topic',
  },
  site: {
    id: 'pages.TaskList.site',
    defaultMessage: 'Site',
  },
  time: {
    id: 'pages.TaskList.time',
    defaultMessage: 'Time',
  },
  paginatorStatus: {
    id: 'pages.TaskList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# task}
      other {# tasks}
    }`,
  },
})

export default messages
