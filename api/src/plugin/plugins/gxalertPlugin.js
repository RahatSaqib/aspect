const getDeviceSeenOn = require('../deviceType/GxAlert/getDeviceSeenOn')
const getDevicePingOn = require('../deviceType/GxAlert/getDevicePingOn')
const preProcessAddDeviceData = require('../deviceType/GxAlert/preProcessAddDeviceData')
const preProcessUpdateDeviceConfiguration = require('../deviceType/GxAlert/preProcessUpdateDeviceConfiguration')
const postProcessUpdateDeviceConfiguration = require('../deviceType/GxAlert/postProcessUpdateDeviceConfiguration')
const transformMergeResultPayload = require('../deviceType/GxAlert/transformMergeResultPayload')
const preProcessMergeResult = require('../deviceType/GxAlert/preProcessMergeResult')
const postProcessMergeResult = require('../deviceType/GxAlert/postProcessMergeResult')
const onResultLogged = require('../deviceType/AspectResultEntry/onResultLogged.js')
const { extractCustomFieldsFromPayload } = require('../deviceType/GxConnect/extractCustomFieldsFromPayload')

const gxalertPlugin = {
  getDeviceSeenOn,
  getDevicePingOn,
  preProcessAddDeviceData,
  preProcessUpdateDeviceConfiguration,
  postProcessUpdateDeviceConfiguration,
  transformMergeResultPayload,
  preProcessMergeResult,
  postProcessMergeResult,
  onResultLogged,
  extractCustomFieldsFromPayload,
}

module.exports = {
  gxalertPlugin,
}
