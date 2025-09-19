const _ = require('lodash')
const { deviceTypeToPlugin, sampleTypeToId } = require('../../../shared/dictionary')
const { parsePatientId } = require('./customFieldsParser')
const { parseNotes } = require('./customFieldsParser')

async function transformMergeResultPayload(context) {
  const customFieldsFromNotes = parseNotes(context.payload.notes)
  const customFieldsFromPatientId = parsePatientId(_.get(context.payload, 'patient.id'))

  // https://systemone.youtrack.cloud/issue/HD-15458/Myanmarsite-disable-custom-fields-for-site-SCH-Yangon
  if (context.deviceId === 3052) {
    // Clear all patient data as custom fields are parsed by GxConnect
    context.payload.patient = {}
    if (customFieldsFromNotes.PatientAge) {
      context.payload.patient.age = customFieldsFromNotes.PatientAge
    }
  }

  context.payload.patient = {
    ...context.payload.patient,
    ...customFieldsFromNotes.patientData,
    ...customFieldsFromPatientId.patientData,
  }

  // Get sample type from custom field "Sample Type" (id: 30)
  const sampleTypeExternalId = _.get(context, 'payload.data.customFieldData[30].value')
  if (sampleTypeExternalId) {
    const sampleTypeId = await sampleTypeToId(sampleTypeExternalId)
    if (sampleTypeId !== null) {
      context.payload.sample.type = { id: sampleTypeExternalId }
    }
  }

  return defaultOrDeviceTypeTransformMergeResultPayload(context)
}

async function defaultOrDeviceTypeTransformMergeResultPayload(context) {
  const { deviceType } = context
  const deviceTypePluginName = await deviceTypeToPlugin(deviceType)
  const { loadPlugin } = require('../../loadPlugin')
  const deviceTypeTransformMergeResultPayload = await loadPlugin(
    undefined,
    deviceTypePluginName,
    'transformMergeResultPayload'
  )
  const transformedPayload = await deviceTypeTransformMergeResultPayload(context)
  return transformedPayload
}

module.exports = transformMergeResultPayload
