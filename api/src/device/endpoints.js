const Joi = require('@hapi/joi')
const { asyncHandler, validateDateRangeParams } = require('../routes')
const {
  listDevices,
  showDevice,
  listApprovalTypes,
  listMaintenanceStatuses,
  listDevicesForSelectList,
  updateDeviceMaintenance,
  getDevicePerformance,
  setStatusForDateRange,
  deviceMaintenanceStatusHistory,
  deviceMaintenanceStatus,
} = require('./service')
const mergeDevices = require('./mergeDevices')
const listWorkload = require('./listWorkload')
const listDeviceMtbErrors = require('./listDeviceMtbErrors')
const listDeviceCapacity = require('./listDeviceCapacity')
const { exportDevices, exportDeviceOperationLogReport } = require('./serviceReports')
const {
  exportWorkloadRequestSchema,
  listWorkloadRequestSchema,
  listWorkloadResponseSchema,
  listDevicesBaseConfig,
  deviceDetailsResponseFields,
  listDevicesBaseRequest,
} = require('./common/validations')
const exportWorkload = require('./exportWorkload')
const { updateDevice } = require('./updateDevice')

const routes = [
  {
    method: 'GET',
    path: '/device/capacity/select-list',
    handler: asyncHandler(listDeviceCapacity),
    config: {
      description: 'Device List',
      notes: 'Pageable and sortable list of devices',
      auth: { scope: ['device:view', 'operationalData:view'] },
      validate: {
        query: {
          deviceTypeId: Joi.string().description(
            'The device type external ID of the device capacity configurations to take'
          ),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array()
            .required()
            .description('The list of device capacity configurations')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('The ID of the device capacity configuration'),
                name: Joi.string().required().description('The name of the device capacity configuration'),
                dailyCapacity: Joi.number()
                  .required()
                  .description('The number of tests that the configuration can perform'),
                modules: Joi.number().allow(null).description('Number of DeviceCapacity modules'),
                externalId: Joi.string().allow(null, '').description('Field externalId of DeviceCapacity'),
                i18nKey: Joi.string().allow(null, '').description('Intl key of DeviceCapacity modules'),
              })
            ),
        }),
      },
    },
  },
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
    path: '/device/workload',
    handler: listWorkload,
    config: {
      description: 'Device List',
      notes: 'Pageable and sortable list of devices',
      auth: { scope: ['device:view'] },
      validate: listWorkloadRequestSchema,
      response: listWorkloadResponseSchema,
    },
  },
  {
    method: 'GET',
    path: '/device/workload/export',
    handler: exportWorkload,
    config: {
      description: 'Workload summary',
      notes: 'Export of the workload',
      auth: { scope: ['device:view'] },
      validate: exportWorkloadRequestSchema,
    },
  },
  {
    method: 'GET',
    path: '/device/performance/{deviceId}',
    handler: asyncHandler(getDevicePerformance),
    config: {
      auth: { scope: ['device:view'] },
      description: 'Historic utilization and error rates for the device',
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
        query: {
          timezoneOffset: Joi.number().description(`Current user's timezone offset`),
        },
      },
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
          approvalToken: Joi.string(),
          configurationData: Joi.object().description(
            'Device configuration data.  The valid keys are dependent on Device Type.'
          ),
          name: Joi.string()
            .description('The name of the device')
            .when('approvalToken', { is: Joi.any().valid(null, ''), then: Joi.required() }),
          notes: Joi.string().allow('', null).description('Any notes that were added to the device'),
          shortName: Joi.string().allow('', null).description('The short name of the device'),
          siteId: Joi.number(),
          implementingPartnerId: Joi.number().allow('', null).description('Implementing partner id'),
          deviceCapacityId: Joi.number().allow(null).optional(),
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
      auth: { scope: ['device:view'] },
      description: 'Device for Select List',
      notes: "List of device ID's and names",
      validate: {
        query: {
          countryId: Joi.number().allow('').description('Country ID'),
          partnerId: Joi.number().allow('').description('Partner ID'),
          siteId: Joi.number().allow('').description('Site ID'),
          showUnapprovedDevices: Joi.bool().optional().default(false).description('Show unapproved devices'),
          onlyResultDevices: Joi.bool().optional().default(false).description('Show only devices that process results'),
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
                approvalStatusI18nKey: Joi.string()
                  .allow('', null)
                  .description('The i18n key for the name of the approval status'),
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
  {
    method: 'POST',
    path: '/device/mergedevices',
    handler: mergeDevices,
    config: {
      auth: { scope: ['device:admin'] },
      description: 'Merges two devices',
      notes: 'Move all relevant data to target device. Deletes source devices.',
      validate: {
        payload: {
          sourceDevicesIds: Joi.array().items(Joi.number()).description('Source devices Ids').required(),
          targetDeviceId: Joi.number().description('Target device Id').required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/device/deviceMtbErrors',
    handler: asyncHandler(listDeviceMtbErrors),
    config: {
      description: 'Device list with errors details for 4 levels',
      notes: 'Contains 4 levels of device locations - State, Lga, Site, Device',
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
            .description('The devices with errors details')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('The ID of the device'),
                name: Joi.string().required().description('The name of the device'),
                shortName: Joi.string().allow('', null).description('The short name of the device'),
                type: Joi.string().allow('', null).description('The type of the device'),
                stateName: Joi.string().allow('', null).description('The state where the device is located'),
                lgaName: Joi.string().allow('', null).description('The lga where the device is located'),
                siteName: Joi.string().allow('', null).description('The name of the site where the device is located'),
                numberOfModules: Joi.number().allow(null).description('Number of modules in device'),
                cntMtbResults: Joi.number()
                  .allow(null)
                  .description('Number of MTB and MTB-Ultra results delivered from the device'),
                cntMtbError: Joi.number().allow(null).description('# of Errors for MTB and MTB-Ultra results'),
                cntMtbInvalid: Joi.number().allow(null).description('# of Invalids for MTB and MTB-Ultra results'),
                cntMtbNoResult: Joi.number().allow(null).description('# of NoResults for MTB and MTB-Ultra results'),
                percentMtbError: Joi.number()
                  .allow(null)
                  .description('Percent of Errors for MTB and MTB-Ultra results'),
                percentMtbInvalid: Joi.number()
                  .allow(null)
                  .description('Percent of Invalids for MTB and MTB-Ultra results'),
                percentMtbNoResult: Joi.number()
                  .allow(null)
                  .description('Percent of NoResults for MTB and MTB-Ultra results'),
              })
            ),
        }),
      },
    },
  },
]

module.exports = { routes }
