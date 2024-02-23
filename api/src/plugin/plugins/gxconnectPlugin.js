const preProcessCreateDevice = require('../deviceType/CepheidGeneXpert/preProcessCreateDevice')
const preProcessAddDeviceData = require('../deviceType/CepheidGeneXpert/preProcessAddDeviceData')
const postProcessUpdateDeviceConfiguration = require('../deviceType/CepheidGeneXpert/postProcessUpdateDeviceConfiguration')
const postProcessAddDeviceOperation = require('../deviceType/CepheidGeneXpert/postProcessAddDeviceOperation')
const transformMergeResultPayload = require('../deviceType/CepheidGeneXpert/transformMergeResultPayload')
const preProcessMergeResult = require('../deviceType/CepheidGeneXpert/preProcessMergeResult')
const onResultLogged = require('../deviceType/AspectResultEntry/onResultLogged.js')
const getCustomFields = require('../deviceType/GxConnect/customFields/customFields')

const gxconnectPlugin = {
  preProcessCreateDevice,
  preProcessAddDeviceData,
  postProcessUpdateDeviceConfiguration,
  postProcessAddDeviceOperation,
  transformMergeResultPayload,
  preProcessMergeResult,
  onResultLogged,
  getCustomFields,
}

module.exports = {
  gxconnectPlugin,
}
