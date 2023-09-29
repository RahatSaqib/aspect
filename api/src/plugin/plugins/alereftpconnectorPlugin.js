const { merge } = require('lodash')
const handlerOptions = require('../deviceType/AlereFtpConnector/handlerOptions')
const getDeviceSeenOn = require('../deviceType/AlereFtpConnector/getDeviceSeenOn')
const preProcessAddDeviceData = require('../deviceType/AlereFtpConnector/preProcessAddDeviceData')
const preProcessMergeResult = require('../deviceType/AlereFtpConnector/preProcessMergeResult')
const postProcessMergeResult = require('../deviceType/AlereFtpConnector/postProcessMergeResult')
const { basePlugin } = require('./basePlugin')

const alereftpconnectorPlugin = {
  handlerOptions: merge({}, basePlugin.handlerOptions, handlerOptions),
  getDeviceSeenOn,
  preProcessAddDeviceData,
  preProcessMergeResult,
  postProcessMergeResult,
}

module.exports = {
  alereftpconnectorPlugin,
}
