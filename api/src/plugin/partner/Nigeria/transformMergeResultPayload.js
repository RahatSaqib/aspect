const { deviceTypeToPlugin } = require('../../../shared/dictionary')
const { parseNotes } = require('./customFieldsParser')

async function transformMergeResultPayload(context) {
  const customFieldsFromNotes = parseNotes(context.payload.notes)
  context.payload.patient = {
    ...context.payload.patient,
    ...customFieldsFromNotes.patientData,
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
