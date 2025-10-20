const _ = require('lodash')
const { startOfDay, parseISO } = require('date-fns')
const { utcToZonedTime, zonedTimeToUtc } = require('date-fns-tz')
const { assayNameToExternalId } = require('../../shared/assayNameToExternalId')
const { gxAlertProbeToAspectProbe } = require('../../shared/gxAlertProbeToAspectProbe')
const { deepMerge } = require('../../shared/json')

const hexArrayToBase64 = hexArray => {
  const buffer = Buffer.from(hexArray)
  return buffer.toString('base64')
}

const transformUTCDateTimeToZoned = (dateTime, timezoneIANA) => {
  return utcToZonedTime(parseISO(dateTime), timezoneIANA).toISOString().replace('.000', '')
}

const transformZonedDateTimeToUTC = (dateTime, timezoneIANA) => {
  return zonedTimeToUtc(parseISO(dateTime), timezoneIANA).toISOString().replace('.000', '')
}

const getCustomFieldValue = (customField, customFieldSchema) => {
  if (!customField.HasValue) {
    return null
  }

  if (customField.Text) {
    return customField.Text
  }

  if (customFieldSchema.items) {
    const item = customFieldSchema.items.find(item => item.key.toString() === customField.Value.toString())
    if (item) {
      return item.value
    }
  }

  return customField.Value
}

const transformCustomFields = (gxAlertCustomFieldsData, customFields) => {
  return gxAlertCustomFieldsData.Values.reduce((acc, customField) => {
    const customFieldSchema =
      customFields.fields.find(cf => cf.id === customField.Id) ||
      customFields.fields.find(cf => cf.migrateFromId === customField.Id)

    if (customFieldSchema) {
      const customFieldData = {
        label: customFieldSchema.title, // customField.ExternalId,
        notAvailable: customField.NotAvailable,
        // key: customField.Value,
        value: getCustomFieldValue(customField, customFieldSchema),
      }

      acc[customField.Id] = customFieldData
    }

    return acc
  }, {})
}

const transformProbes = gxAlertProbeData => {
  if (!gxAlertProbeData) return

  return Object.keys(gxAlertProbeData).reduce((acc, probe) => {
    return gxAlertProbeData[probe] !== null
      ? { ...acc, [gxAlertProbeToAspectProbe[probe]]: gxAlertProbeData[probe] }
      : acc
  }, {})
}

const transformPayload = (gxAlertPayload, isResultPayload, timeZoneData = {}, customFields) => {
  const { timezone, timezoneIANA, timezoneUtcOffset } = timeZoneData

  const aspectPayload = {
    includeDeviceConfiguration: !isResultPayload,
    name: gxAlertPayload.DeviceName,
    serial: gxAlertPayload.DeviceSerial,
    status: null,
    type: { id: 'CepheidGeneXpert' },
    site: null,
    checkpoint: null,
    getFormsDefinition: false,
    log: null,
    configuration: {
      checkpoint: null,
      data: {
        country: gxAlertPayload.Country,
        macAddress: gxAlertPayload.ComputerId,
        hostId: gxAlertPayload.HostId,
        deviceSerialNumber: gxAlertPayload.DeviceSerial,
        systemTime: { localTime: parseISO(gxAlertPayload.MessageSentOn).toISOString(), timezoneUtcOffset },
        timezone,
      },
    },
    operation: null,
    result: {
      id: gxAlertPayload.ExternalId,
      checkpoint: null,
      startedOn: gxAlertPayload.TestStartedOn.includes('Z')
        ? gxAlertPayload.TestStartedOn
        : transformZonedDateTimeToUTC(gxAlertPayload.TestStartedOn, timezoneIANA),
      endedOn: gxAlertPayload.TestEndedOn.includes('Z')
        ? gxAlertPayload.TestEndedOn
        : transformZonedDateTimeToUTC(gxAlertPayload.TestEndedOn, timezoneIANA),
      data: {
        deviceApiKey: null,
        hostId: gxAlertPayload.HostId,
        deviceName: gxAlertPayload.DeviceName,
        deviceShortName: gxAlertPayload.DeviceShortName,
        country: gxAlertPayload.Country,
        computerId: gxAlertPayload.ComputerId,
        deviceSerial: gxAlertPayload.DeviceSerial,
        assay: gxAlertPayload.Assay,
        testTypeId: gxAlertPayload.TestTypeId,
        assayVersion: gxAlertPayload.AssayVersion,
        testStartedOn: gxAlertPayload.TestStartedOn.includes('Z')
          ? transformUTCDateTimeToZoned(gxAlertPayload.TestStartedOn, timezoneIANA).slice(0, 19)
          : gxAlertPayload.TestStartedOn,
        testEndedOn: gxAlertPayload.TestEndedOn.includes('Z')
          ? transformUTCDateTimeToZoned(gxAlertPayload.TestEndedOn, timezoneIANA).slice(0, 19)
          : gxAlertPayload.TestEndedOn,
        cartridgeExpirationDate: gxAlertPayload.CartridgeExpirationDate.includes('Z')
          ? transformUTCDateTimeToZoned(gxAlertPayload.CartridgeExpirationDate, timezoneIANA).slice(0, 19)
          : gxAlertPayload.CartridgeExpirationDate,
        cartridgeSerial: gxAlertPayload.CartridgeSerial,
        moduleName: gxAlertPayload.ModuleName,
        moduleSerial: gxAlertPayload.ModuleSerial,
        instrumentSerial: gxAlertPayload.InstrumentSerial,
        sampleId: gxAlertPayload.SampleId,
        patientId: gxAlertPayload.PatientId,
        patientId2: gxAlertPayload.PatientId2,
        patientFirstName: gxAlertPayload.PatientFirstName,
        patientLastName: gxAlertPayload.PatientLastName,
        patientMiddleName: gxAlertPayload.PatientMiddleName,
        user: gxAlertPayload.User,
        messageSentOn: gxAlertPayload.MessageSentOn,
        reagentLotId: gxAlertPayload.ReagentLotId,
        softwareVersion: gxAlertPayload.SoftwareVersion,
        resultText: gxAlertPayload.ResultText,
        notes: gxAlertPayload.Notes,
        errorCode: gxAlertPayload.ErrorCode,
        errorNotes: gxAlertPayload.ErrorNotes,
        gxConnectVersion: gxAlertPayload.GxConnectVersion,
        externalId: gxAlertPayload.ExternalId,
        eTBExamId: gxAlertPayload.eTBExamId,
        probeDataWithMeltPeak: gxAlertPayload.ProbeDataWithMeltPeak,
        resultTextIsUsingLabels: gxAlertPayload.ResultTextIsUsingLabels,
      },
      assay: { id: assayNameToExternalId[gxAlertPayload.Assay.toUpperCase()], version: gxAlertPayload.AssayVersion },
      location: null,
      type: null,
      source: null,
      sample: {
        id: gxAlertPayload.SampleId,
        collectedOn: null,
        group: null,
        runNumber: null,
        type: null,
        originSite: null,
      },
      category: null,
      consumable: [
        {
          serial: gxAlertPayload.CartridgeSerial,
          lot: gxAlertPayload.ReagentLotId,
          expirationDate: startOfDay(parseISO(gxAlertPayload.CartridgeExpirationDate)) // Truncate time
            .toISOString()
            .replace('.000', ''),
        },
      ],
      instrument: {
        serial: gxAlertPayload.InstrumentSerial,
        module: { name: gxAlertPayload.ModuleName, serial: gxAlertPayload.ModuleSerial },
      },
      research: null,
      patient: {
        id: gxAlertPayload.PatientId,
        surname: gxAlertPayload.PatientLastName,
      },
      sender: { version: gxAlertPayload.SoftwareVersion, operator: gxAlertPayload.User },
      oemData: null,
      rawData: null, // TODO
      notes: gxAlertPayload.Notes,
      error: gxAlertPayload.ErrorCode ? { code: gxAlertPayload.ErrorCode, notes: gxAlertPayload.ErrorNotes } : null,
    },
  }

  const conditionalMappings = {
    AssayType: 'result.data.assayType',
    AssayGuid: 'result.data.assayGuid',
    AssayIsCliaWaived: 'result.data.assayIsCliaWaived',
    AssayProductCode: 'result.data.assayProductCode',
    State: 'result.data.state',
    SampleTypeKey: 'result.data.sampleTypeKey',
    DatagramFormat: 'result.data.datagramFormat',
    ProbeData: 'result.data.probes',
    TestData: 'result.data.testData',
    ProbeDataWithMeltPeak: 'result.data.probeDataWithMeltPeak',
    Analytes: 'result.data.analytes',
    Adc2Psi: 'result.data.adc2Psi',
    CustomFieldData: 'result.data.customFieldData',
    CreationTime: 'result.data.creationTime',
    DataReductionAlg: 'result.data.dataReductionAlg',
    ErrorStatus: 'result.data.errorStatus',
    FirmwareVersion: 'result.data.firmwareVersion',
    IcoreSerialNumber: 'result.data.icoreSerialNumber',
    LisEnabled: 'result.data.lisEnabled',
    Errors: 'result.data.errors',
    ModificationTime: 'result.data.modificationTime',
    OrderTime: 'result.data.orderTime',
    TestType: 'result.data.testType',
    ActualTestEndedOn: 'result.data.actualTestEndedOn',
  }

  const customMappings = {
    ProbeData: ProbeData => transformProbes(ProbeData),
    TestData: TestData => hexArrayToBase64(TestData),
    CustomFieldData: CustomFieldData => transformCustomFields(CustomFieldData, customFields),
    ActualTestEndedOn: ActualTestEndedOn => {
      return ActualTestEndedOn.includes('Z')
        ? transformUTCDateTimeToZoned(ActualTestEndedOn, timezoneIANA).slice(0, 19)
        : ActualTestEndedOn
    },
    OrderTime: OrderTime => transformUTCDateTimeToZoned(OrderTime, timezoneIANA).slice(0, 19),
    ModificationTime: ModificationTime => transformUTCDateTimeToZoned(ModificationTime, timezoneIANA).slice(0, 19),
    CreationTime: CreationTime => transformUTCDateTimeToZoned(CreationTime, timezoneIANA).slice(0, 19),
  }

  const additionalData = Object.keys(conditionalMappings).reduce((acc, gxAlertField) => {
    const gxAlertValue = gxAlertPayload[gxAlertField]
    if (gxAlertValue) {
      const path = conditionalMappings[gxAlertField]
      const transformFunction = customMappings[gxAlertField]

      const value = transformFunction ? transformFunction(gxAlertValue) : gxAlertValue

      _.set(acc, path, value)
    }
    return acc
  }, {})

  return deepMerge({ ...aspectPayload }, additionalData)
}

module.exports = {
  transformPayload,
  transformUTCDateTimeToZoned,
}
