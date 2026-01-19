const Joi = require('@hapi/joi')
const { asyncHandler, validateDateRangeParams } = require('../routes')
const {
  showDevice,
  listApprovalTypes,
  listMaintenanceStatuses,
  listDevicesForSelectList,
  updateDeviceMaintenance,
  setStatusForDateRange,
  deviceMaintenanceStatusHistory,
  deviceMaintenanceStatus,
} = require('./service')
const { getDevicePerformance } = require('./getDevicePerformance')
const { mergeDevices } = require('./deviceComposition/mergeDevices')
const listWorkload = require('./listWorkload')
const listDeviceMtbErrors = require('./listDeviceMtbErrors')
const { exportDeviceOperationLogReport, getDeviceCoverageReport } = require('./serviceReports')
const {
  exportWorkloadRequestSchema,
  listWorkloadRequestSchema,
  listWorkloadResponseSchema,
  listDevicesBaseConfig,
  deviceDetailsResponseFields,
  listDevicesBaseRequest,
} = require('./common/validations')
const exportWorkload = require('./exportWorkload')
const { listDevices } = require('./listDevices')
const { updateDevice } = require('./updateDevice')
const { listAnnualUtilizationRateNational, listAnnualUtilizationRateProvincial } = require('./utilizationReports')
const { deviceReport } = require('./serviceReports/deviceReport')
const getMtbErrorGraph = require('./getErrorGraph')
const { joiSingleDeviceStatusOverTime } = require('../shared/validation')

const { getDeviceInstruments } = require('./getDeviceInstruments')
const { getCandidateInstruments } = require('./getCandidateInstruments')

const { transferInstruments } = require('./deviceComposition/transferInstruments')
const { transferInstrumentToNewDevice } = require('./deviceComposition/transferInstrumentToNewDevice')

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
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object({
          ok: Joi.bool().required(),
          length: Joi.number().required(),
          utilizationRateAvg: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
          errorRateAvg: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
          data: Joi.array()
            .items(
              Joi.object({
                totalResult: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                errorCount: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                monthTested: Joi.string().required(),
                workingDays: Joi.number().required(),
                utilizationRate: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                errorRate: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                dailyTestCapacity: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null).optional(),
                lastDayOfMonth: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
              })
            )
            .required(),
        }),
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
    method: 'GET',
    path: '/device/{deviceId}/instruments',
    handler: asyncHandler(getDeviceInstruments),
    config: {
      description: 'Device Instruments',
      notes: 'Get instruments and modules for a device',
      auth: { scope: ['device:view'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
        query: {
          includeHistory: Joi.boolean()
            .default(false)
            .description('Include historical instruments and modules that have been removed'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object()
            .keys({
              deviceId: Joi.number().required().description('Device ID'),
              instruments: Joi.array()
                .items(
                  Joi.object().keys({
                    instrumentId: Joi.number().required().description('Instrument ID'),
                    instrumentSerial: Joi.number().required().description('Instrument serial number'),
                    modules: Joi.array()
                      .items(
                        Joi.object().keys({
                          moduleName: Joi.string().allow(null).description('Module bay name (e.g., A1, A2, etc.)'),
                          lastResultDate: Joi.date().allow(null).description('Date of last result for this module'),
                        })
                      )
                      .description('List of modules in this instrument'),
                  })
                )
                .description('List of instruments connected to the device')
                .optional(),
            })
            .description('Device composition data'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/device/{deviceId}/candidate-instruments',
    handler: asyncHandler(getCandidateInstruments),
    config: {
      description: 'Candidate Instruments',
      notes: 'Get candidate instruments that can be joined with the device',
      auth: { scope: ['device:view'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object()
            .keys({
              deviceId: Joi.number().required().description('Device ID'),
              instruments: Joi.array()
                .items(
                  Joi.object().keys({
                    deviceId: Joi.number().required().description('Device ID'),
                    deviceName: Joi.string().required().description('Device name'),
                    instrumentId: Joi.number().required().description('Instrument ID'),
                    instrumentSerial: Joi.string().allow(null).description('Instrument serial number'),
                    modules: Joi.array()
                      .items(
                        Joi.object().keys({
                          moduleName: Joi.string().allow(null).description('Module bay name (e.g., A1, A2, etc.)'),
                          lastResultDate: Joi.date().allow(null).description('Date of last result for this module'),
                        })
                      )
                      .description('List of modules in this instrument'),
                  })
                )
                .description('List of candidate instruments'),
            })
            .required(),
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
          instrumentsConnected: Joi.number().min(1).description('Number of connected instruments'),
          gx6cModulesCount: Joi.number()
            .allow('', null)
            .min(0)
            .description('Number of GX-6C modules on GenExpert device'),
          gx10cModulesCount: Joi.number()
            .allow('', null)
            .min(0)
            .description('Number of GX-10C modules on GenExpert device'),
          dailyTestCapacity: Joi.number().allow(null).optional(),
          moduleBayCapacity: Joi.number()
            .optional()
            .min(0)
            .max(256)
            .description('The module bay capacity of the device'),
          stickerInstrumentSerial: Joi.string().allow('', null).optional(),
          instrumentModel: Joi.string().allow('', null).optional(),
          softwareType: Joi.string().allow('', null).optional(),
          isDaisyChained: Joi.bool().allow('', null).optional(),
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
    handler: deviceReport,
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
          showDecommissionedDevices: Joi.bool().optional().default(false).description('Show decommissioned devices'),
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
          expectedBackOnline: Joi.string()
            .allow('', null)
            .description(
              'Shallow access to the value inside DeviceMaintenanceStatusLog -> data.options.data.expectedBackOnline'
            ),
          parentQuery: Joi.object().keys({
            minDate: Joi.date().iso().required().description('From Date, inclusive'),
            maxDate: Joi.date().iso().required().description('To Date, inclusive'),
          }),
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
              expectedBackOnline: Joi.string()
                .allow('', null)
                .description('The expected back online date of the last maintenance status'),
              deviceData: joiSingleDeviceStatusOverTime,
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
          expectedBackOnline: Joi.string()
            .allow('', null)
            .description('The expected Online back date of the last the maintenance status'),
          parentQuery: Joi.object().keys({
            minDate: Joi.date().iso().required().description('From Date, inclusive'),
            maxDate: Joi.date().iso().required().description('To Date, inclusive'),
          }),
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
              expectedBackOnline: Joi.string()
                .allow('', null)
                .description('The expected Online back date of the last the maintenance status'),
              deviceData: joiSingleDeviceStatusOverTime,
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
    method: 'POST',
    path: '/device/transfer-instruments',
    handler: asyncHandler(transferInstruments),
    config: {
      auth: { scope: ['device:admin'] },
      description: 'Transfer instruments to a target device',
      notes: 'Moves instruments by instrumentId to the specified target device.',
      validate: {
        payload: {
          sourceInstrumentsIds: Joi.array()
            .items(Joi.number().integer().positive())
            .description('Array of instrument IDs to transfer')
            .required(),
          targetDeviceId: Joi.number().description('Target device ID').required(),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/device/transfer-instrument-to-new-device',
    handler: asyncHandler(transferInstrumentToNewDevice),
    config: {
      auth: { scope: ['device:edit'] },
      description: 'Transfer instrument to a new device',
      notes: 'Creates a new device and transfers the instrument to it',
      tags: ['api', 'device'],
      validate: {
        payload: Joi.object({
          instrumentId: Joi.number().integer().positive().required(),
          name: Joi.string().required(),
          shortName: Joi.string().required(),
          siteId: Joi.number().required(),
        }),
      },
      response: {
        schema: Joi.object({
          ok: Joi.bool().required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/device/device-mtb-errors',
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
                cnt: Joi.number()
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

  {
    method: 'GET',
    path: '/device/annual-utilization-rate-national',
    handler: asyncHandler(listAnnualUtilizationRateNational),
    config: {
      description: 'National Trends in Annual Utilization Rates',
      notes:
        'The National Trends in annual utilization rates displays the percentage of utilization for the current year and the previous 5 years of data',
      auth: { scope: ['device:view', 'operationalData:view'] },
      validate: {
        query: { ...validateDateRangeParams(false), tableData: Joi.string().optional() },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of items that match the given filters'),
          length: Joi.number().required().description('The number of items included in this response'),
          data: Joi.array()
            .required()
            .description('The devices with rates details')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('The ID of the device'),
                name: Joi.string().required().description('The name of the device'),
                cnt: Joi.number().required().description('Number of tests by device in whole date range (all periods)'),
                stateId: Joi.number().allow(null).description('The ID of the state'),
                modules: Joi.number().allow(null).description('Number of modules in device'),
                dailyCapacity: Joi.number().required().description('Daily capacity of the device'),
                shortName: Joi.string().allow('', null).description('The short name of the device'),
                type: Joi.string().allow('', null).description('The type of the device'),
                stateName: Joi.string().allow('', null).description('The state where the device is located'),
                lgaName: Joi.string().allow('', null).description('The lga where the device is located'),
                siteName: Joi.string().allow('', null).description('The name of the site where the device is located'),
                rates: Joi.array()
                  .required()
                  .description('The rates of device for all periods in date range')
                  .items(
                    Joi.object().keys({
                      year: Joi.string().required().description('The year period'),
                      count: Joi.number().required().description('Total tests accomplished by device in the period'),
                      rate: Joi.number().required().description('Device utilization rate in the period'),
                    })
                  ),
              })
            ),
          WORKING_DAYS_IN_YEAR: Joi.number().required().description('Number of working days per year'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/device/annual-utilization-rate-provincial',
    handler: asyncHandler(listAnnualUtilizationRateProvincial),
    config: {
      description: 'Provincial Trends in Annual Utilization Rates',
      notes:
        'The Provincial Trends in annual utilization rates displays the percentage of utilization for the current year and the previous 5 years of data',
      auth: { scope: ['device:view', 'operationalData:view'] },
      validate: {
        query: { ...validateDateRangeParams(false) },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of items that match the given filters'),
          length: Joi.number().required().description('The number of items included in this response'),
          data: Joi.array()
            .required()
            .description('The states with rates details for all their devices')
            .items(
              Joi.object().keys({
                stateId: Joi.number().allow(null).description('The ID of the state'),
                stateName: Joi.string().allow('', null).description('The state where the device is located'),
                lgaName: Joi.string().allow('', null).description('The lga where the device is located'),
                modules: Joi.number().required().description('Total number of modules across all devices in the state'),
                dailyCapacity: Joi.number().required().description('Daily capacity of all devices in the state'),
                rates: Joi.array()
                  .required()
                  .description('The rates of device for all periods in date range')
                  .items(
                    Joi.object().keys({
                      year: Joi.string().required().description('The year period'),
                      count: Joi.number().required().description('Total tests accomplished by device in the period'),
                      rate: Joi.number().required().description('Device utilization rate in the period'),
                    })
                  ),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/device/coverage',
    handler: getDeviceCoverageReport,
    config: {
      description: 'List of Devices with 6- and 1-color modules aggregations',
      notes: 'List is prepared for expandable table with nested rows for country-state-lga-site-device levels',
      auth: { scope: ['device:view'] },
      validate: {
        query: {
          assay: Joi.alternatives().try(Joi.array(), Joi.string()).description('Filter for assay'),
          ...validateDateRangeParams(false),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/device/mtb-errors-graph',
    handler: getMtbErrorGraph,
    config: {
      auth: { scope: ['device:view'] },
      validate: {
        query: {
          category: Joi.string().valid('invalid', 'error', 'noResult').required(),
          state: Joi.string(),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array()
            .required()
            .items(
              Joi.object().keys({
                month: Joi.number().description('The month of the year'),
                year: Joi.number(),
                percentage: Joi.number().description('The percentage of th error'),
              })
            ),
        }),
      },
    },
  },
]

module.exports = { routes }
