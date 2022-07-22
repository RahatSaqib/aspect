const Joi = require('@hapi/joi')
const { asyncHandler, validateDateRangeParams, validateSortPageParams } = require('../routes')
const {
  listDevices,
  showDevice,
  updateDevice,
  listApprovalTypes,
  listMaintenanceStatuses,
  listDevicesForSelectList,
  updateDeviceMaintenance,
  getDevicePerformance,
  setStatusForDateRange,
  onDeviceMaintenanceStatusLogged,
  onResultLogged,
  onDeviceUpdateMaintenanceStatus,
  onDeviceUpdateMaintenanceStatusNoResults,
  onDeviceMaintenanceResolved,
  deviceMaintenanceStatusHistory,
  deviceMaintenanceStatus,
  onDeviceMaintenanceStatusLogScheduled,
} = require('./service')
const { exportDevices, exportDeviceOperationLogReport } = require('./serviceReports')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { taskTracker } = require('../scheduler/taskTracker')

function listDevicesBaseConfig() {
  return { ...listDevicesBaseRequest(), ...listDevicesBaseResponse() }
}

function listDevicesBaseRequest(isoDateFormatExpected = false) {
  return {
    auth: { scope: ['device:view', 'operationalData:view'] },
    validate: {
      query: {
        issueTypeId: Joi.array()
          .optional()
          .items(Joi.string())
          .single()
          .description('Optional parameter for filtering devices related to issues of this type'),
        onlyOpenIssues: Joi.number()
          .min(0)
          .max(1)
          .allow('')
          .description('Optional parameter for filtering devices related to Open Issues only. default value is false'),
        hasResults: Joi.number()
          .allow('')
          .min(0)
          .max(1)
          .description('Filter for getting devices that can have results'),
        hasConnectivity: Joi.number()
          .allow('')
          .min(0)
          .max(1)
          .description('Filter for getting devices that can have connectivity'),
        deviceIds: Joi.string().allow('').description('Filter for device ids'),
        assayId: Joi.alternatives()
          .try(Joi.array().items(Joi.number()), Joi.number())
          .allow(null, '')
          .description('Filter for assay ID(s)'),
        diseaseId: Joi.number().integer().positive().optional().description('The disease ID'),
        deviceName: Joi.string().allow('').description('Filter for device name'),
        deviceMaintenanceStatusId: Joi.array()
          .items(Joi.string())
          .single()
          .allow(null)
          .description('Filter for device maintenance status external id'),
        deviceApprovalId: Joi.number().allow('').description('Filter for device approval ID'),
        deviceTypeId: Joi.number().allow('').description('Filter for device type ID'),
        deviceType: Joi.string().allow('').description('Filter for device type ExternalId'),
        category: Joi.string().description('Filter for device type category'),
        type: Joi.string().description('Filter for device type'),
        name: Joi.string().allow('').description('Filter for device name'),
        siteName: Joi.string().allow('').description('Filter for site name'),
        siteId: Joi.number().allow(null).description('Filter for site Id'),
        siteExternalId: Joi.string().allow('').description('Filter for facility code'),
        // query param 'format' is applicable only for handler 'exportDevices'
        format: Joi.string().allow('').description('File format for exporting data'),
        ...validateAllGeographyFilterParams(),
        ...validateDateRangeParams(isoDateFormatExpected),
        ...validateSortPageParams(
          // TODO: Add 'availabilityRate' Sort Page Param
          'name',
          'state',
          'statusI18nKey',
          'errorRate',
          'createdOn',
          'lastSeen',
          'lastPingOn',
          'resultCountLastMonth',
          'resultCountThisMonth',
          'deliveredLastMonth',
          'deliveredThisMonth',
          'acknowledgedRatio',
          'totalFlagged'
        ),
      },
    },
  }
}

function listDevicesBaseResponse() {
  return {
    response: {
      options: {
        allowUnknown: false,
      },
      schema: Joi.object().keys({
        ok: Joi.bool().required().description('False if there was some sort of error'),
        total: Joi.number().required().description('The total number of devices that match the given filters'),
        length: Joi.number().required().description('The number of devices included in this response'),
        data: Joi.array()
          .required()
          .description('The devices')
          .items(
            Joi.object().keys({
              id: Joi.number().required().description('The ID of the device'),
              name: Joi.string().required().description('The name of the device'),
              shortName: Joi.string().allow('', null).description('The short name of the device'),
              createdOn: Joi.date().required().description('When the device was added to the database'),
              lastPingOn: Joi.date().allow(null).description('When the device last pinged'),
              lastSeen: Joi.date()
                .allow(null)
                .description(
                  'When the device was last seen. Unlike the ping, this date is also updated whenever the device sends a results, not just on an explicit ping.'
                ),
              state: Joi.string().allow('', null).description('The state where the device is located'),
              type: Joi.string().allow('', null).description('The type of the device'),
              siteName: Joi.string().allow('', null).description('The name of the site where the device is located'),
              approval: Joi.string().required().description('The current approval status of the device'),
              status: Joi.string().required().description('The current status of the device'),
              statusI18nKey: Joi.string().required().description('The i18n key for the name of the status'),
              maintenanceStatus: Joi.string()
                .allow('', null)
                .description('The current maintenance status of the device'),
              maintenanceStatusI18nKey: Joi.string()
                .allow('', null)
                .description('The i18n key for the name of the maintenance status'),
              maintenanceStatusName: Joi.string()
                .allow('', null)
                .description('The default name of the current maintenance status of the device'),
              maintenanceStatusActive: Joi.number().allow(null).description('Whether the device is active or not'),
              maintenanceStatusManuallySet: Joi.number()
                .allow(null)
                .description('Whether the device status is manually set'),
              category: Joi.string().required().description('The device category'),
              hasResults: Joi.number()
                .required()
                .min(0)
                .max(1)
                .description('Does the device have/produce results (i.e. a medical device)?'),
              hasConnectivity: Joi.number()
                .required()
                .min(0)
                .max(1)
                .description('Does the device have connectivity built-in (i.e. a device with an included router)?'),
              resultCountThisMonth: Joi.number().allow(null).description('Number of results in the last 30 days'),
              resultCountLastMonth: Joi.number()
                .allow(null)
                .description('Number of results in the 30 days before that'),
              deliveredThisMonth: Joi.number()
                .allow(null)
                .description('Number of results delivered in the last 30 days'),
              deliveredLastMonth: Joi.number()
                .allow(null)
                .description('Number of results delivered in the 30 days before that'),
              issueCategories: Joi.array()
                .required()
                .description('The categories of issues currently active for this device.'),
              availability: Joi.object()
                .required()
                .description('Stats on the availability of the device in the last 30 days.')
                .keys({
                  count: Joi.number().required().description('The number of days the device was available.'),
                  total: Joi.number().required().description('The total number of days in the period'),
                  rate: Joi.number().required().description('The availability rate'),
                }),
              error: Joi.object()
                .required()
                .description('Stats on the errors that the device produced in the last 30 days.')
                .keys({
                  count: Joi.number().required().description('The number of errors produced'),
                  total: Joi.number().required().description('The total number of results'),
                  rate: Joi.number().required().description('The error rate'),
                }),
            })
          ),
      }),
    },
  }
}

const deviceDetailsResponseFields = Joi.object()
  .required()
  .description('Device details fields')
  .keys({
    id: Joi.number().required().description('The ID of the device'),
    name: Joi.string().required().description('The name of the device'),
    shortName: Joi.string().allow('', null).description('The short name of the device'),
    createdOn: Joi.date().required().description('When the device was added to the database'),
    lastPingOn: Joi.date().allow(null).description('When the device last pinged'),
    lastSeen: Joi.date()
      .allow(null)
      .description(
        'When the device was last seen. Unlike the ping, this date is also updated whenever the device sends a results, not just on an explicit ping.'
      ),
    state: Joi.string().allow('', null).description('The state where the device is located'),
    siteId: Joi.number().allow('', null).description('The ID of the site where the device is located'),
    siteName: Joi.string().allow('', null).description('The name of the site where the device is located'),
    hostId: Joi.string().allow('', null).description('The host ID of the device'),
    deviceType: Joi.object()
      .keys({
        id: Joi.number().required().description('ID of the device type'),
        name: Joi.string().required().description('Name of the device type'),
        externalId: Joi.string().required().description('External ID of the device type'),
        configurationDataSchema: Joi.object()
          .allow('', null)
          .description('Configuration data schema associated with the device type'),
        deviceOperationSchema: Joi.object()
          .allow('', null)
          .description('Operation data schema associated with the device type'),
      })
      .description('Details on the device type of the device'),
    deviceApprovalId: Joi.number().required().description('The device approval status ID of the device'),
    configurationData: Joi.object().allow('', null).description('Configuration data for the device'),
    notes: Joi.string().allow('', null).description('Any notes that were added to the device'),
    serial: Joi.string().allow('', null).description('The serial number of the device'),
    approval: Joi.string().required().description('The current approval status of the device'),
    maintenanceStatus: Joi.string().allow('', null).description('The current maintenance status of the device'),
    maintenanceStatusI18nKey: Joi.string()
      .allow('', null)
      .description('The i18n key for the name of the maintenance status'),
    maintenanceStatusName: Joi.string()
      .allow('', null)
      .description('The default name of the current maintenance status of the device'),
    maintenanceStatusNotes: Joi.string().allow('', null).description('The notes of the last the maintenance status'),
    maintenanceStatusActive: Joi.number().allow(null).description('Whether the device is active or not'),
    maintenanceStatusManuallySet: Joi.number().allow(null).description('Whether the device status is manually set'),
    approvalToken: Joi.string().required().description('The external ID of the approval'),
    approvalStatusI18nKey: Joi.string().required().description('The i18nkey  of the device approval status'),
    category: Joi.string().required().description('The device category'),
    hasResults: Joi.number()
      .required()
      .min(0)
      .max(1)
      .description('Does the device have/produce results (i.e. a medical device)?'),
    hasConnectivity: Joi.number()
      .required()
      .min(0)
      .max(1)
      .description('Does the device have connectivity built-in (i.e. a device with an included router)?'),
    resultCountThisMonth: Joi.number().allow(null).description('Number of results in the last 30 days'),
    resultCountLastMonth: Joi.number().allow(null).description('Number of results in the 30 days before that'),
    resultCount60: Joi.number().allow(null).description('Number of results in the last 60 days'),
    utilizationRateThisMonth: Joi.number().allow(null).description('Utilization rate in last 30 days'),
    errorCountThisMonth: Joi.number().allow(null).description('Number of errors in the last 30 days'),
    errorCountLastMonth: Joi.number().allow(null).description('Number of errors in the 30 days before that'),
    errorCount60: Joi.number().allow(null).description('Number of results in the last 60 days'),
    errorRateThisMonth: Joi.number().allow(null).description('Error rate in last 30 days'),
    dailyCapacity: Joi.number().allow(null).description('Number of results delivered in the last 30 days'),
    deliveredLastMonth: Joi.number().allow(null).description('Number of results delivered in the 30 days before that'),
    calibrationDate: Joi.date().allow(null).description('Date of the last calibration'),
    calibrationNotes: Joi.string().allow('', null).description('Notes about the last calibration'),
    warrantyDueDate: Joi.date().allow(null).description('Latest warranty due date'),
    warrantyNotes: Joi.string().allow('', null).description('Notes on the latest warranty'),
  })

const routes = [
  {
    method: 'GET',
    path: '/device',
    handler: asyncHandler(listDevices),
    config: {
      description: 'Device List',
      notes: 'Pageable and sortable list of devices',
      ...listDevicesBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/device/performance/{deviceId}',
    handler: asyncHandler(getDevicePerformance),
    config: {
      auth: { scope: ['device:view'] },
      description: 'Historic utilization and error rates for the device',
    },
  },
  {
    method: 'GET',
    path: '/device/{deviceId}',
    handler: asyncHandler(showDevice),
    config: {
      description: 'Device Detail',
      notes: 'Detail of a device',
      auth: { scope: ['device:view'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
        query: {
          dateRange: Joi.number().allow('').description('Filter for date range'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: deviceDetailsResponseFields,
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/device/{deviceId}',
    handler: asyncHandler(updateDevice),
    config: {
      description: 'Update Device Detail',
      notes: 'Detail of a device',
      auth: { scope: ['device:edit'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
        payload: {
          siteId: Joi.number(),
          approvalToken: Joi.string(),
          configurationData: Joi.object().description(
            'Device configuration data.  The valid keys are dependent on Device Type.'
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/device/approval-types',
    handler: asyncHandler(listApprovalTypes),
    config: {
      description: 'Device Approval List',
      notes: 'Dictionary set of Device Approval options',
      auth: { scope: ['device:view'] },
    },
  },
  {
    method: 'GET',
    path: '/device/maintenance-statuses',
    handler: asyncHandler(listMaintenanceStatuses),
    config: {
      description: 'Device Maintenance Status List',
      notes: 'Set of Device Maintenance Status options',
      auth: { scope: ['device:view', 'operationalData:view'] },
      validate: {
        query: {
          onlyManuallySet: Joi.bool().optional().description('Only the manually set statuses'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/device/export',
    handler: exportDevices,
    config: {
      description: 'Export Device List into Excel or CSV',
      notes: 'Filtered and sorted list of devices',
      ...listDevicesBaseRequest(),
    },
  },
  {
    method: 'GET',
    path: '/device/exportDeviceLogs',
    handler: exportDeviceOperationLogReport,
    config: {
      description: 'Export Device logs List into Excel or CSV',
      notes: 'Filtered and sorted list of device logs',
      auth: { scope: ['device:view', 'operationalData:view'] },
      validate: {
        query: {
          deviceId: Joi.number().allow('').description('Filter for device ID'),
          deviceType: Joi.string().allow('').description('Filter for device type ExternalId'),
          format: Joi.string().allow('').description('File format for exporting data'),
          ...validateDateRangeParams(false),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/device/select-list',
    handler: asyncHandler(listDevicesForSelectList),
    config: {
      description: 'Device for Select List',
      notes: "List of device ID's and names",
      validate: {
        query: {
          countryId: Joi.number().allow('').description('Country ID'),
          partnerId: Joi.number().allow('').description('Partner ID'),
          siteId: Joi.number().allow('').description('Site ID'),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/device/maintenance/{deviceId}',
    handler: asyncHandler(updateDeviceMaintenance),
    config: {
      description: 'Set Device Maintenance',
      notes: 'Insert maintenance of a device',
      auth: { scope: ['device:edit'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
        payload: {
          externalId: Joi.string(),
          contextDate: Joi.date()
            .iso()
            .description('Specified date for type of maintenance, i.e. warranty due date, calibration date'),
          notes: Joi.string().allow('', null),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: deviceDetailsResponseFields,
          deviceMaintenanceId: Joi.number().required().description('DeviceMaintenance.id for specified deviceId'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/device/maintenance-status/{deviceId}',
    handler: asyncHandler(deviceMaintenanceStatus),
    config: {
      description: 'Device Maintenance Status Information for a Device',
      notes: 'Gets the Device Maintenance Status Log Information',
      auth: { scope: ['device', 'operationalData'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object()
            .allow(null, {})
            .keys({
              id: Joi.number().allow(null).description('The ID of the maintenance log'),
              deviceId: Joi.number().allow(null).description('The ID of the device'),
              deviceMaintenanceStatusId: Joi.number().allow(null).description('The ID of the maintenance status'),
              data: Joi.object()
                .allow(null)
                .description('Additional contextual data logged with the maintenance status update'),
              notes: Joi.string()
                .allow('', null)
                .description(
                  'Shallow access to the value inside DeviceMaintenanceStatusLog -> data.options.data.notes'
                ),
              day: Joi.date().allow(null).description('The day of the maintenance status update'),
              createdOn: Joi.date().allow(null).description('The date & time that the maintenance status was updated'),
              createdBy: Joi.number().allow(null).description('The ID of the user who updated the maintenance status'),
            }),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/device/maintenance-status/{deviceId}',
    handler: asyncHandler(setStatusForDateRange),
    config: {
      description: 'Set Device Maintenance',
      notes: 'Update maintenance status of a device',
      auth: { scope: ['device:edit'] },
      validate: {
        params: {
          deviceId: Joi.number().description('Device ID').required(),
        },
        payload: {
          externalId: Joi.string().description(
            'The external ID of the maintenance status EG. active, reportedActive, inactiveOutOfInventory...'
          ),
          day: Joi.date()
            .iso()
            .description(
              'Specified date for the maintenance status so that it can be updated as an historical snapshot'
            ),
          options: Joi.object()
            .allow(null)
            .description(
              'The additional JSON data to append in the maintenance status log. Data values such as extra dates and notes can be included in this object'
            ),
          notes: Joi.string()
            .allow('', null)
            .description('Shallow access to the value inside DeviceMaintenanceStatusLog -> data.options.data.notes'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('Device maintenance status details fields')
            .keys({
              deviceMaintenanceStatusLogId: Joi.number()
                .required()
                .description('DeviceMaintenanceStatusLog.id that was created'),
              maintenanceStatus: Joi.string().allow('', null).description('The maintenance status of the device'),
              maintenanceStatusI18nKey: Joi.string()
                .allow('', null)
                .description('The i18n key for the name of the maintenance status'),
              maintenanceStatusName: Joi.string()
                .allow('', null)
                .description('The default name of the maintenance status'),
              maintenanceStatusNotes: Joi.string()
                .allow('', null)
                .description('The notes of the last the maintenance status'),
              maintenanceStatusActive: Joi.number().allow(null).description('Whether the device was active or not'),
              maintenanceStatusManuallySet: Joi.number()
                .allow(null)
                .description('Whether the device status was manually set'),
              maintenanceStatusManuallySetBy: Joi.object()
                .allow(null)
                .description('Member responsible for manually setting the status'),
            }),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/device/maintenance-status-by-period/{deviceId}',
    handler: asyncHandler(setStatusForDateRange),
    config: {
      description: 'Set Device Maintenance for a date range',
      // notes: 'Update maintenance status of a device',
      auth: { scope: ['device:edit'] },
      validate: {
        params: {
          deviceId: Joi.number().description('Device ID').required(),
        },
        payload: {
          externalId: Joi.string()
            .required()
            .description(
              'The external ID of the maintenance status (active, reportedActive, inactiveOutOfInventory...)'
            ),
          dateFrom: Joi.date()
            .iso()
            .required()
            .description(
              'Specified initial date for the maintenance status so that it can be updated as an historical snapshot'
            ),
          dateTo: Joi.date()
            .iso()
            .required()
            .description(
              'Specified end date for the maintenance status so that it can be updated as an historical snapshot'
            ),
          notes: Joi.string()
            .allow('', null)
            .description('Shallow access to the value inside DeviceMaintenanceStatusLog -> data.options.data.notes'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('Device maintenance status details fields')
            .keys({
              deviceMaintenanceStatusLogIds: Joi.array().description(
                'The list of ids of the inserted DeviceMaintenanceStatusLog'
              ),
              maintenanceStatus: Joi.string().allow('', null).description('The maintenance status of the device'),
              maintenanceStatusI18nKey: Joi.string()
                .allow('', null)
                .description('The i18n key for the name of the maintenance status'),
              maintenanceStatusName: Joi.string()
                .allow('', null)
                .description('The default name of the maintenance status'),
              maintenanceStatusNotes: Joi.string()
                .allow('', null)
                .description('The notes of the last the maintenance status'),
              maintenanceStatusActive: Joi.number().allow(null).description('Whether the device was active or not'),
              maintenanceStatusManuallySet: Joi.number()
                .allow(null)
                .description('Whether the device status was manually set'),
              maintenanceStatusManuallySetBy: Joi.object()
                .allow(null)
                .description('Member responsible for manually setting the status'),
            }),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/device/maintenance-status',
    handler: asyncHandler(deviceMaintenanceStatusHistory),
    config: {
      description: 'Device list with maintenance status history for each day',
      notes: 'Used as a data source for the device status calendar on the operational dashboard',
      ...listDevicesBaseRequest(true),
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of devices that match the given filters'),
          length: Joi.number().required().description('The number of devices included in this response'),
          data: Joi.array()
            .required()
            .description('The devices')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('The ID of the device'),
                name: Joi.string().required().description('The name of the device'),
                shortName: Joi.string().allow('', null).description('The short name of the device'),
                createdOn: Joi.date().required().description('When the device was added to the database'),
                lastPingOn: Joi.date().allow(null).description('When the device last pinged'),
                lastSeen: Joi.date()
                  .allow(null)
                  .description(
                    'When the device was last seen. Unlike the ping, this date is also updated whenever the device sends a results, not just on an explicit ping.'
                  ),
                state: Joi.string().allow('', null).description('The state where the device is located'),
                type: Joi.string().allow('', null).description('The type of the device'),
                siteName: Joi.string().allow('', null).description('The name of the site where the device is located'),
                approval: Joi.string().required().description('The current approval status of the device'),
                maintenanceStatus: Joi.string().allow('', null).description('The maintenance status of the device'),
                maintenanceStatusI18nKey: Joi.string()
                  .allow('', null)
                  .description('The i18n key for the name of the maintenance status'),
                maintenanceStatusName: Joi.string()
                  .allow('', null)
                  .description('The default name of the maintenance status'),
                maintenanceStatusActive: Joi.number().allow(null).description('Whether the device was active or not'),
                maintenanceStatusManuallySet: Joi.number()
                  .allow(null)
                  .description('Whether the device status was manually set'),
                status: Joi.string().required().description('The current status of the device'),
                statusI18nKey: Joi.string().required().description('The i18n key for the name of the status'),
                category: Joi.string().required().description('The device category'),
                hasResults: Joi.number()
                  .required()
                  .min(0)
                  .max(1)
                  .description('Does the device have/produce results (i.e. a medical device)?'),
                hasConnectivity: Joi.number()
                  .required()
                  .min(0)
                  .max(1)
                  .description('Does the device have connectivity built-in (i.e. a device with an included router)?'),
                resultCount: Joi.number().allow(null).description('Number of results delivered from the device'),
                days: Joi.array()
                  .required()
                  .description('The device status on each day')
                  .items(
                    Joi.object().keys({
                      date: Joi.date().required().description('The day that the device was in this maintenance status'),
                      externalId: Joi.string().allow('', null).description('The id of the maintenance status'),
                      isWeekend: Joi.boolean().required().description('Whether the day is a weekend or not'),
                      data: Joi.object().allow(null),
                      notes: Joi.string()
                        .allow('', null)
                        .description('Shallow access to the value inside data => $.options.data.notes'),
                    })
                  ),
              })
            ),
        }),
      },
    },
  },
]

const subscriptions = [
  {
    actions: {
      DEVICE_MAINTENANCE_STATUS_LOGGED: onDeviceMaintenanceStatusLogged,
      RESULT_LOGGED: onResultLogged,
      DEVICE_MAINTENANCE: onDeviceUpdateMaintenanceStatus,
      DEVICE_NO_RESULTS: onDeviceUpdateMaintenanceStatusNoResults,
      DEVICE_MAINTENANCE_RESOLVED: onDeviceMaintenanceResolved,
      DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED: async (action, context) =>
        taskTracker(onDeviceMaintenanceStatusLogScheduled, action, context),
    },
  },
]

module.exports = { routes, subscriptions }
