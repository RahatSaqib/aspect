const _ = require('lodash')
const { sampleTypeToId } = require('../../../shared/dictionary')
const { parsePatientId } = require('./customFieldsParser')
const { parseNotes } = require('./customFieldsParser')

async function transformMergeResultPayload(context) {
  const customFieldsFromNotes = parseNotes(context.payload.result.notes)
  const customFieldsFromPatientId = parsePatientId(_.get(context.payload.result, 'patient.id'))

  // https://systemone.youtrack.cloud/issue/HD-15458/Myanmarsite-disable-custom-fields-for-site-SCH-Yangon
  if (context.deviceId === 3052) {
    // Clear all patient data as custom fields are parsed by GxConnect
    context.payload.result.patient = {}
    if (customFieldsFromNotes.PatientAge) {
      context.payload.result.patient.age = customFieldsFromNotes.PatientAge
    }
  }

  context.payload.result.patient = {
    ...context.payload.result.patient,
    ...customFieldsFromNotes.patientData,
    ...customFieldsFromPatientId.patientData,
  }

  // Get sample type from custom field "Sample Type" (id: 30)
  const sampleTypeExternalId = _.get(context.payload, 'result.data.customFieldData[30].value')
  if (sampleTypeExternalId) {
    const sampleTypeId = await sampleTypeToId(sampleTypeExternalId)
    if (sampleTypeId !== null) {
      context.payload.result.sample.type = { id: sampleTypeExternalId }
    }
  }

  return defaultOrDeviceTypeTransformMergeResultPayload(context)
}

async function defaultOrDeviceTypeTransformMergeResultPayload(context) {
  const { deviceTypePluginName } = context

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
