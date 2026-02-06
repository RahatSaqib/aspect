const Joi = require('@hapi/joi')

const { validateDateRangeParams, validateSortPageParams } = require('../../routes')
const { validateAllGeographyFilterParams } = require('../../geography/requestValidation')

const exportWorkloadRequestSchema = {
  query: {
    assayId: Joi.number().allow(null, '').description('Filter for assay ID'),
    deviceName: Joi.string().allow('').description('Filter for device name'),
    deviceMaintenanceStatusId: Joi.array()
      .items(Joi.string())
      .single()
      .allow(null)
      .description('Filter for device maintenance status external id'),
    format: Joi.string().allow(null, '').description('File format for exporting data'),
    ...validateAllGeographyFilterParams(),
    ...validateDateRangeParams(true),
  },
}

const listWorkloadRequestSchema = {
  query: {
    assayId: Joi.number().allow(null, '').description('Filter for assay ID'),
    deviceName: Joi.string().allow('').description('Filter for device name'),
    deviceMaintenanceStatusId: Joi.array()
      .items(Joi.string())
      .single()
      .allow(null)
      .description('Filter for device maintenance status external id'),
    ...validateAllGeographyFilterParams(),
    ...validateDateRangeParams(true),
    ...validateSortPageParams(
      'name',
      'deviceStatus',
      'lastPingOn',
      'firstResultConductedOn',
      'lastResultConductedOn',
      'total',
      'firstResultEndedOn',
      'lastResultEndedOn',
      'lgaName',
      'stateName'
    ),
  },
}

const listWorkloadResponseSchema = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    total: Joi.number().required().description('The total number of devices that match the given filters'),
    length: Joi.number().required().description('The number of devices included in this response'),
    data: Joi.array().required().description('The devices and the workload for each result category'),
    extraColumns: Joi.array().allow(null).optional().description('Extra columns arrays').items(Joi.object().optional()),
  }),
}

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
        deviceApprovalId: Joi.alternatives()
          .try(Joi.array().items(Joi.number()).single(), Joi.number())
          .allow('', null)
          .description('Filter for device approval ID(s)'),
        deviceTypeId: Joi.number().allow('').description('Filter for device type ID'),
        deviceType: Joi.string().allow('').description('Filter for device type ExternalId'),
        category: Joi.string().description('Filter for device type category'),
        type: Joi.string().description('Filter for device type'),
        name: Joi.string().allow('').description('Filter for device name'),
        connectorStatus: Joi.array()
          .items(Joi.string())
          .single()
          .allow(null)
          .description('Filter for connector status'),
        siteName: Joi.string().allow('').description('Filter for site name'),
        geneXpertType: Joi.string().allow('').description('Filter for GeneXpert type'),
        siteId: Joi.number().allow(null).description('Filter for site Id'),
        siteExternalId: Joi.string().allow('').description('Filter for facility code'),
        // query param 'format' is applicable only for handler 'deviceReport'
        format: Joi.string().allow('').description('File format for exporting data'),
        ...validateAllGeographyFilterParams(),
        ...validateDateRangeParams(isoDateFormatExpected),
        ...validateSortPageParams(
          // TODO: Add 'availabilityRate' Sort Page Param
          'name',
          'siteName',
          'state',
          'statusI18nKey',
          'maintenanceStatusI18nKey',
          'approvalStatusI18nKey',
          'errorRate',
          'createdOn',
          'lastSeen',
          'lastPingOn',
          'resultCountLastMonth',
          'resultCountThisMonth',
          'deliveredLastMonth',
          'deliveredThisMonth',
          'acknowledgedRatio',
          'totalFlagged',
          'deviceStatus',
          'connectorVersion',
          'lastResultConductedOn'
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
              deviceStatus: Joi.string().allow('', null).description('The connector status'),
              connectorStatus: Joi.string().allow('', null).description('The connector status'),
              connectorVersion: Joi.string().allow('', null).description('The connector version'),
              createdOn: Joi.date().required().description('When the device was added to the database'),
              lastResultConductedOn: Joi.date().allow(null).description('When the device generate last result'),
              lastPingOn: Joi.date().allow(null).description('When the device last pinged'),
              lastSeen: Joi.date()
                .allow(null)
                .description(
                  'When the device was last seen. Unlike the ping, this date is also updated whenever the device sends a results, not just on an explicit ping.'
                ),
              lastPingInUtc: Joi.date().allow(null).description('When the device last pinged'),
              createdOnInUtc: Joi.date().required().description('When the device was added to the database'),
              state: Joi.string().allow('', null).description('The state where the device is located'),
              type: Joi.string().allow('', null).description('The type of the device'),
              siteName: Joi.string().allow('', null).description('The name of the site where the device is located'),
              approval: Joi.string().required().description('The current approval status of the device'),
              status: Joi.string().required().description('The current status of the device'),
              statusI18nKey: Joi.string().required().description('The i18n key for the name of the status'),
              approvalStatusI18nKey: Joi.string()
                .allow('', null)
                .description('The i18n key for the name of the approval status'),
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
              timezoneIANA: Joi.string().allow(null).description('IANA timezone of the country'),
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
    implementingPartnerId: Joi.number().allow('', null).description('Implementing partner id'),
    implementingPartnerName: Joi.string().allow('', null).description('Implementing partner name'),
    instrumentsConnected: Joi.number().description('The number of instruments assigned to the device or connector'),
    gx6cModulesCount: Joi.number().allow('', null).description('Number of GX-6C modules on GenExpert device'),
    gx10cModulesCount: Joi.number().allow('', null).description('Number of GX-10C modules on GenExpert device'),
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
    moduleBayCapacity: Joi.number().required().description('The module bay capacity of the device'),
    approval: Joi.string().required().description('The current approval status of the device'),
    maintenanceStatus: Joi.string().allow('', null).description('The current maintenance status of the device'),
    maintenanceStatusI18nKey: Joi.string()
      .allow('', null)
      .description('The i18n key for the name of the maintenance status'),
    maintenanceStatusName: Joi.string()
      .allow('', null)
      .description('The default name of the current maintenance status of the device'),
    maintenanceStatusNotes: Joi.string().allow('', null).description('The notes of the last the maintenance status'),
    expectedBackOnline: Joi.string()
      .allow('', null)
      .description('The expected back online of the last the maintenance status'),
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
    dailyTestCapacity: Joi.number().allow(null).description('daily test capacity'),
    dailyCapacityModules: Joi.number().allow(null).description('Number of DeviceCapacity modules'),
    deliveredLastMonth: Joi.number().allow(null).description('Number of results delivered in the 30 days before that'),
    calibrationDate: Joi.date().allow(null).description('Date of the last calibration'),
    calibrationNotes: Joi.string().allow('', null).description('Notes about the last calibration'),
    warrantyDueDate: Joi.date().allow(null).description('Latest warranty due date'),
    warrantyNotes: Joi.string().allow('', null).description('Notes on the latest warranty'),
    stickerInstrumentSerial: Joi.string().allow('', null).description('Cepheid sticker instrument serial'),
    instrumentModel: Joi.string().allow('', null).description('Cepheid instrument model'),
    softwareType: Joi.string().allow('', null).description('Cepheid software type'),
    isDaisyChained: Joi.bool().allow('', null).description('Determines if the instrument is daisy chained'),
  })
module.exports = {
  listWorkloadRequestSchema,
  listWorkloadResponseSchema,
  listDevicesBaseConfig,
  listDevicesBaseResponse,
  listDevicesBaseRequest,
  deviceDetailsResponseFields,
  exportWorkloadRequestSchema,
}
