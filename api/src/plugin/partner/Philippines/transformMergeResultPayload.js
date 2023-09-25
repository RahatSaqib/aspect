const _ = require('lodash')
const { deviceTypeToPlugin } = require('../../../shared/dictionary')

async function transformMergeResultPayload(context) {
  const { deviceType, payload } = context
  if (deviceType === 'CepheidGeneXpert') {
    setPatientNamesFromCustomFields(payload)
  }
  return defaultOrDeviceTypeTransformMergeResultPayload(context)
}

function setPatientNamesFromCustomFields(payload) {
  const patientName = _.get(payload, 'patient.name')
  const patientSurname = _.get(payload, 'patient.surname')
  if (!patientName && !patientSurname) {
    const customFieldData = Object.values(_.get(payload, 'data.customFieldData', {}))
    if (!_.isEmpty(customFieldData)) {
      const patientFirstNameCustomField =
        customFieldData.find(customFieldValue => customFieldValue.label === 'First Name of Patient') || {}
      const patientMiddleNameCustomField =
        customFieldData.find(customFieldValue => customFieldValue.label === 'Middle Name of Patient') || {}
      let patientName = ''
      if (patientFirstNameCustomField.value) {
        patientName = patientFirstNameCustomField.value
      }
      if (patientMiddleNameCustomField.value) {
        if (patientName) {
          patientName += ' '
        }
        patientName += patientMiddleNameCustomField.value
      }
      if (patientName) {
        _.set(payload, 'patient.name', patientName)
      }
      const patientLastNameCustomField =
        customFieldData.find(customFieldValue => customFieldValue.label === 'Last Name of Patient') || {}
      if (patientLastNameCustomField.value) {
        _.set(payload, 'patient.surname', patientLastNameCustomField.value)
      }
    }
  }
}

async function defaultOrDeviceTypeTransformMergeResultPayload(context) {
  const { deviceType } = context
  const plugin = await deviceTypeToPlugin(deviceType)
  const { loadPlugin } = require('../../loadPlugin')
  const deviceTypeTransformMergeResultPayload = await loadPlugin([plugin], 'transformMergeResultPayload')
  const transformedPayload = await deviceTypeTransformMergeResultPayload(context)
  return transformedPayload
}

module.exports = transformMergeResultPayload
