const preProcessAddDeviceData = require('../deviceType/CepheidGeneXpert/preProcessAddDeviceData')
const postProcessUpdateDeviceConfiguration = require('../deviceType/CepheidGeneXpert/postProcessUpdateDeviceConfiguration')
const postProcessAddDeviceOperation = require('../deviceType/CepheidGeneXpert/postProcessAddDeviceOperation')
const postProcessCreateDevice = require('../deviceType/CepheidGeneXpert/postProcessCreateDevice')
const transformMergeResultPayload = require('../deviceType/CepheidGeneXpert/transformMergeResultPayload')
const preProcessMergeResult = require('../deviceType/CepheidGeneXpert/preProcessMergeResult')
const onResultLogged = require('../deviceType/CepheidGeneXpert/onResultLogged.js')
const getCustomFields = require('../deviceType/GxConnect/customFields/customFields')
const transformMergeResultResponse = require('../deviceType/CepheidGeneXpert/transformMergeResultResponse')
const { extractCustomFieldsFromPayload } = require('../deviceType/GxConnect/extractCustomFieldsFromPayload')
const { identifyDevice } = require('../../deviceApi/gxConnect/identifyDevice')

const gxconnectPlugin = {
  identifyDevice,
  preProcessAddDeviceData,
  postProcessUpdateDeviceConfiguration,
  postProcessAddDeviceOperation,
  postProcessCreateDevice,
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
