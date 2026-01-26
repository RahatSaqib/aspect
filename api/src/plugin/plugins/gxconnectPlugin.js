const preProcessCreateDevice = require('../deviceType/CepheidGeneXpert/preProcessCreateDevice')
const preProcessAddDeviceData = require('../deviceType/CepheidGeneXpert/preProcessAddDeviceData')
const postProcessUpdateDeviceConfiguration = require('../deviceType/CepheidGeneXpert/postProcessUpdateDeviceConfiguration')
const postProcessAddDeviceOperation = require('../deviceType/CepheidGeneXpert/postProcessAddDeviceOperation')
const transformMergeResultPayload = require('../deviceType/CepheidGeneXpert/transformMergeResultPayload')
const preProcessMergeResult = require('../deviceType/CepheidGeneXpert/preProcessMergeResult')
const onResultLogged = require('../deviceType/CepheidGeneXpert/onResultLogged.js')
const getCustomFields = require('../deviceType/GxConnect/customFields/customFields')
const transformMergeResultResponse = require('../deviceType/CepheidGeneXpert/transformMergeResultResponse')
const { extractCustomFieldsFromPayload } = require('../deviceType/GxConnect/extractCustomFieldsFromPayload')
const resolveDevicePlugin = require('../deviceType/CepheidGeneXpert/resolveDevicePlugin')

const gxconnectPlugin = {
  preProcessCreateDevice,
  resolveDevicePlugin,
  preProcessAddDeviceData,
  postProcessUpdateDeviceConfiguration,
  postProcessAddDeviceOperation,
  transformMergeResultPayload,
  transformMergeResultResponse,
  preProcessMergeResult,
  onResultLogged,
  getCustomFields,
  extractCustomFieldsFromPayload,
}

module.exports = {
  gxconnectPlugin,
}
