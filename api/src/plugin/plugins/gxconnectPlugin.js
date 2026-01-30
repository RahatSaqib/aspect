const postProcessUpdateDeviceConfiguration = require('../deviceType/CepheidGeneXpert/postProcessUpdateDeviceConfiguration')
const postProcessAddDeviceOperation = require('../deviceType/CepheidGeneXpert/postProcessAddDeviceOperation')
const postProcessCreateDevice = require('../deviceType/CepheidGeneXpert/postProcessCreateDevice')
const transformMergeResultPayload = require('../deviceType/CepheidGeneXpert/transformMergeResultPayload')
const preProcessMergeResult = require('../deviceType/CepheidGeneXpert/preProcessMergeResult')
const onResultLogged = require('../deviceType/CepheidGeneXpert/onResultLogged.js')
const getCustomFields = require('../deviceType/GxConnect/customFields/customFields')
const { extractCustomFieldsFromPayload } = require('../deviceType/GxConnect/extractCustomFieldsFromPayload')
const { identifyDevice } = require('../../deviceApi/gxConnect/identifyDevice')

const gxconnectPlugin = {
  identifyDevice,
  postProcessUpdateDeviceConfiguration,
  postProcessAddDeviceOperation,
  postProcessCreateDevice,
  transformMergeResultPayload,
  preProcessMergeResult,
  onResultLogged,
  getCustomFields,
  extractCustomFieldsFromPayload,
}

module.exports = {
  gxconnectPlugin,
}
