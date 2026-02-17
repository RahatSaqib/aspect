const Joi = require('@hapi/joi')

const errorPayload = Joi.object()
  .allow(null)
  .keys({
    code: Joi.string().allow('', null).description('Error code'),
    notes: Joi.string().allow('', null).description('Description of the error'),
  })

const devicePayload = {
  name: Joi.string().allow('', null).description('The device name'),
  serial: Joi.string().allow('', null).description('The device serial number'),
  approval: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string()
        .required()
        .description('The device approval status. Only approved devices will deliver results.'),
    }),
  type: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('The Device Type. Required on first request with API Key'),
    }),
  site: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('ID of the site where the device is located'),
    }),
}

const configurationPayload = {
  data: Joi.object().required().description('Device configuration data.  The valid keys are dependent on Device Type.'),
}

const operationPayload = {
  startedOn: Joi.date()
    .iso()
    .description('Date and optional time the operation began. If only one date is available, use endedOn'),
  endedOn: Joi.date().iso().description('Date and optional time the operation finished.'),
  data: Joi.object().required().description('Device operational data.  The valid keys are dependent on Device Type.'),
}

const resultPayload = {
  id: Joi.string()
    .allow('', null)
    .description(
      'Identifies this result to allow future updates.  If the ID is specified by the client,' +
        ' multiple result updates with the same ID will merge into the same result.  If no ID is' +
        ' specified, a new result is created with every POST.'
    ),
  startedOn: Joi.date()
    .allow(null)
    .iso()
    .description('Date and optional time the test began. If only one date is available, use endedOn'),
  endedOn: Joi.date().allow(null).iso().description('Date and optional time the test finished.'),
  data: Joi.object().description('Assay dependent test result data.'),
  assay: Joi.object().keys({
    id: Joi.string().required().description('A known Assay configured within Aspect.'),
    version: Joi.string().allow('', null).description('Version of assay specified by Device'),
  }),
  location: Joi.object()
    .allow(null)
    .keys({
      latitude: Joi.number().description('Latitude where the test was collected. Will default to the site location'),
      longitude: Joi.number().description('Longitude where the test was collected. Will default to the site location'),
    }),
  type: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('The Result Type. Defaults to Patient.'),
    }),
  source: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().required().description('The Result Source. Defaults to "Diagnostic Device".'),
    }),
  sample: Joi.object().keys({
    id: Joi.string().allow('', null).description('Client specific identifier of the sample tested.'),
    collectedOn: Joi.date().allow(null).iso().description('Date and optional time the sample was collected.'),
    group: Joi.string().allow('', null).description('The group, collection, or worksheet of a sample'),
    runNumber: Joi.string().allow('', null).description('Sample run number.'),
    type: Joi.object()
      .allow(null)
      .keys({
        id: Joi.string().required().description('ID of the Sample Type'),
      }),
    originSite: Joi.object()
      .allow(null)
      .keys({
        id: Joi.string().required().description('ID of the site where the sample was collected'),
        name: Joi.string().allow('', null).description('Name of the site where the sample was collected'),
        shortName: Joi.string().allow('', null).description('Short name of the site where the sample was collected'),
        notes: Joi.string().allow('', null).description('Notes about the site where the sample was collected'),
        state: Joi.string().allow('', null).description('Name of the state or province where the sample was collected'),
        lga: Joi.string()
          .allow('', null)
          .description('Short name of the LGA or district where the sample was collected'),
        city: Joi.string().allow('', null).description('City name of the site where the sample was collected'),
        street1: Joi.string()
          .allow('', null)
          .description('Address (line 1) of the site where the sample was collected'),
        street2: Joi.string()
          .allow('', null)
          .description('Address (line 2) of the site where the sample was collected'),
        zip: Joi.string().allow('', null).description('Zip/Postal code of the site where the sample was collected'),
        location: Joi.object()
          .allow(null)
          .keys({
            latitude: Joi.number().description(
              'Latitude where the sample was collected. Will default to the site location'
            ),
            longitude: Joi.number().description(
              'Longitude where the sample was collected. Will default to the site location'
            ),
          }),
        timezoneId: Joi.string()
          .allow('', null)
          .description('The timezone for the site (format: Myanmar Standard Time)'),
        hoursStart: Joi.number().allow('', null).description('The hour that the site opens on a working day'),
        hoursEnd: Joi.number().allow('', null).description('The hour that the site closes on a working day'),
      }),
  }),
  category: Joi.array()
    .allow(null)
    .items(
      Joi.object().keys({
        id: Joi.string()
          .required()
          .description(
            'Assay dependent categorization of the Result.  Default Error if error specified,' +
              ' otherwise Success. If the Assay supports only a single category, can send a single' +
              ' JSON object instead of an Array.'
          ),
      })
    )
    .min(0)
    .max(2)
    .single(true),
  consumable: Joi.array()
    .allow(null)
    .items(
      Joi.object().keys({
        serial: Joi.string()
          .allow('', null)
          .description('Serial Number of inventory item consumed during completion of this test'),
        lot: Joi.string()
          .allow('', null)
          .description('Lot Number of inventory item consumed during completion of this test'),
        expirationDate: Joi.date()
          .allow(null)
          .iso()
          .description('Expiration Date of inventory item consumed during completion of this test'),
      })
    )
    .min(0)
    .max(1)
    .single(true),
  instrument: Joi.object().keys({
    serial: Joi.string().allow('', null).description('Serial number of insrument used to collect the test results'),
    module: Joi.object().keys({
      name: Joi.string()
        .allow('', null)
        .description('Name of module enabled by the instrument while collecting the test results'),
      serial: Joi.string()
        .allow('', null)
        .description('Name of module enabled by the instrument while collecting the test results'),
    }),
  }),
  research: Joi.object()
    .allow(null)
    .keys({
      id: Joi.string().allow('', null).description('Identifies a research study for which the test is completed.'),
    }),
  patient: Joi.object().keys({
    id: Joi.string().allow('', null).description('Patient Identifier'),
    name: Joi.string().allow('', null).description('Patient name'),
    surname: Joi.string().allow('', null).description('Patient surname'),
    gender: Joi.string().allow('', null).description('Patient gender (M/F)'),
    age: Joi.number().allow(null).description('Patient age (years)'),
    dateOfBirth: Joi.date().iso().allow(null).description('Patient date of birth'),
    address: Joi.string().allow('', null).description('Patient address'),
    street: Joi.string().allow('', null).description('Patient street'),
    city: Joi.string().allow('', null).description('Patient city'),
    state: Joi.string().allow('', null).description('Patient state'),
    zip: Joi.string().allow('', null).description('Patient ZIP/Postal code'),
    phone: Joi.string().allow('', null).description('Patient phone number'),
    hivStatus: Joi.string().allow('', null).description("Patient's HIV Status"),
    microscopyResult: Joi.string().allow('', null).description("Patient's microscopy result"),
    drSuspect: Joi.string().allow('', null).description('Suspected Drug Resistance'),
    previouslyTreated: Joi.string().allow('', null).description('Has patient been previously treated?'),
  }),
  sender: Joi.object().keys({
    version: Joi.string()
      .allow('', null)
      .description('Version of software used, separate from the instrument, to complete the test'),
    operator: Joi.string().allow('', null).description('The person who completed the test'),
  }),
  oemData: Joi.any().description('Proprietary data for OEM'),
  rawData: Joi.any().description('Field for sending raw data directly from a device'),
  notes: Joi.string().allow('', null).description('Any additional notes associated with this result'),
  error: errorPayload,
}

const testAggResponseValidation = () => {
  return Joi.array()
    .required()
    .description('Test aggregate')
    .items(
      Joi.object().keys({
        province: Joi.string().allow(null, '').required(),
        district: Joi.string().allow(null, '').required(),
        health_facility: Joi.string().allow(null, '').required(),
        test_results: Joi.object().keys({
          Tests: Joi.number().description('Total number of tests'),
          Tests_MTB_NOT_DETECTED: Joi.number().description('Number of tests where MTB was not detected'),
          Tests_MTB_DETECTED: Joi.number().description('Number of tests where MTB was detected'),
          Tests_ERROR: Joi.number().description('Number of tests with errors'),
          Tests_NO_RESULT: Joi.number().description('Number of tests with no result'),
          Tests_INVALID: Joi.number().description('Number of invalid tests'),
          Tests_RIF_DETECTED: Joi.number().description('Number of tests where RIF was detected'),
          Tests_RIF_INDETERMINATE: Joi.number().description('Number of tests with indeterminate RIF result'),
        }),
        date: Joi.date().required(),
      })
    )
}

const testAggRequestQueryValidation = () => {
  return {
    dateFrom: Joi.date().timestamp().required().description('Test start date'),
    dateTo: Joi.date().timestamp().required().description('Test end date'),
  }
}

const logItem = {
  externalId: Joi.alternatives()
    .try(Joi.string(), Joi.number())
    .allow('', null)
    .description('External unique id of the entry in remote system'),
  occurredOn: Joi.date().required().iso().description('Date/time of when log entry happened'),
  logFileName: Joi.string().required().description('Log file name'),
  logLevel: Joi.string().required().description('Log Level (INFO, ERROR, etc)'),
  details: Joi.alternatives()
    .try(
      Joi.object().description('Log details JSON - error code, content of the log entry, log file name, category'),
      Joi.string().description('Log details stringified - to be parsed at run-time')
    )
    .required(),
}

const logPayload = {
  source: Joi.string().allow('', null).description('The source of the log, determined by client'),
  data: Joi.array().allow(null).items(Joi.object().keys(logItem)),
}

const devicePayloadValidation = Joi.object().keys({
  ...devicePayload,
  includeDeviceConfiguration: Joi.bool()
    .allow(null)
    .optional()
    .description(
      'This flag will determine (When true) if the service is going to respond as part of the response the general configuration of the device'
    ),
  log: Joi.object().allow(null).keys(logPayload).description('Device Log Data'),
  configuration: Joi.object().allow(null).keys(configurationPayload).description('Device Configuration Data'),
  operation: Joi.object().allow(null).keys(operationPayload).description('Device Operation Data'),
  result: Joi.object().allow(null).keys(resultPayload).description('Device Result Data.'),
  getFormsDefinition: Joi.bool()
    .optional()
    .allow(null)
    .description('This is a flag to tell the API if the request source is a daily details POST'),
})

module.exports = {
  errorPayload,
  testAggResponseValidation,
  testAggRequestQueryValidation,
  devicePayloadValidation,
}
