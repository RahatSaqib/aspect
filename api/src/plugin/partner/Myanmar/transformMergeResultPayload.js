const { deviceTypeToPlugin } = require('../../../shared/dictionary')
const { customParse } = require('./notesCustomFieldsParser')

async function transformMergeResultPayload(context) {

  const customFieldsFromNotes = parseNotes(payload)
  context.payload.patientData = { ...context.payload.patientData, ...customFieldsFromNotes }
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
