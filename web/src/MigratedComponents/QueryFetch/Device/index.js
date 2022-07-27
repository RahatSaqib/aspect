import { defineMessages } from 'react-intl'

const DAILY_STATUS = {
  ENDPOINT: '/device/maintenance-over-time',
  KEY: 'DAILY_STATUS',
}

const DEVICE_DETAIL = {
  ENDPOINT: '/device',
  KEY: 'DEVICE_DETAIL',
}

const DEVICE_PERFORMANCE = {
  ENDPOINT: '/device/performance',
  KEY: 'DEVICE_PERFORMANCE',
}

const DEVICE_TYPES = {
  ENDPOINT: '/device-type/select-list',
  KEY: 'DEVICE_TYPES',
}

const DEVICE_STATUS = {
  ENDPOINT: '/device/maintenance-statuses',
  KEY: 'DEVICE_STATUS',
}

const DEVICE_STATUS_LAST_REPORTED = {
  ENDPOINT: '/device/maintenance-last-reported',
  KEY: 'DEVICE_STATUS_LAST_REPORTED',
}

const DEVICE_LIST = {
  ENDPOINT: '/device',
  KEY: 'DEVICE_LIST',
}

const DEVICE_SELECT_LIST = {
  ENDPOINT: '/device/select-list',
  KEY: 'DEVICE_SELECT_LIST',
}

const DEVICE_MAINTENANCE_STATUS_BY_PERIOD = {
  ENDPOINT: '/device/maintenance-status-by-period/:deviceId',
  ERRORS: {
    400: {
      'You cannot change the status of a device in days when it was active': {
        severity: 'warn',
        ...defineMessages({
          title: {
            id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.title',
            defaultMessage: 'Validation error',
          },
          message: {
            id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.cannotChangeStatusFromActive.message',
            defaultMessage: 'You cannot change the status of a device in days when it was active',
          },
          resolution: {
            id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.cannotChangeStatusFromActive.resolution',
            defaultMessage:
              "Please, change the date range. Some of the selected days are set to status Active, and they can't be changed",
          },
        }),
      },
    },
    'You cannot change the status of a device in days when it was decommissioned': {
      severity: 'warn',
      ...defineMessages({
        title: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.title',
          defaultMessage: 'Validation error',
        },
        message: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.cannotChangeStatusFromDecommissioned.message',
          defaultMessage: 'You cannot change the status of a device in days when it was decommissioned',
        },
        resolution: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.cannotChangeStatusFromDecommissioned.resolution',
          defaultMessage:
            "Please, change the date range. Some of the selected days are set to status Decommissioned, and they can't be changed",
        },
      }),
    },
    "The status you are trying to assign can't be set manually": {
      severity: 'warn',
      ...defineMessages({
        title: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.title',
          defaultMessage: 'Validation error',
        },
        message: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.statusCannotBeSetManually.message',
          defaultMessage: "The status you are trying to assign can't be set manually",
        },
        resolution: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.statusCannotBeSetManually.resolution',
          defaultMessage: 'Please, select another maintenance status.',
        },
      }),
    },
    'Status "Decommissioned" cannot be set for a date range': {
      severity: 'warn',
      ...defineMessages({
        title: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.title',
          defaultMessage: 'Validation error',
        },
        message: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.decommissionedCannotBeSetForDateRange.message',
          defaultMessage: 'The status "Decommissioned" cannot be set for a date range',
        },
        resolution: {
          id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.decommissionedCannotBeSetForDateRange.resolution',
          defaultMessage: 'Please, select another maintenance status.',
        },
      }),
    },
    'You cannot change the status of a device to "Reported Active" for days when it was reported as "No Tests Performed"':
      {
        severity: 'warn',
        ...defineMessages({
          title: {
            id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.title',
            defaultMessage: 'Validation error',
          },
          message: {
            id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.cannotSetActiveForDaysWhenNoTestsPerformed.message',
            defaultMessage:
              'You cannot change the status of a device to "Reported Active" for days when it was reported as "No Tests Performed"',
          },
          resolution: {
            id: 'errorResponseMessages.updateMaintenanceStatusByPeriod.POST.400.cannotSetActiveForDaysWhenNoTestsPerformed.resolution',
            defaultMessage: 'Please, select another maintenance status.',
          },
        }),
      },
  },
}

export {
  DAILY_STATUS,
  DEVICE_DETAIL,
  DEVICE_PERFORMANCE,
  DEVICE_TYPES,
  DEVICE_STATUS,
  DEVICE_STATUS_LAST_REPORTED,
  DEVICE_LIST,
  DEVICE_SELECT_LIST,
  DEVICE_MAINTENANCE_STATUS_BY_PERIOD,
}
