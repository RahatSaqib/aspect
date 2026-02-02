const postProcessUpdateDeviceConfiguration = require('../deviceType/CepheidGeneXpert/postProcessUpdateDeviceConfiguration')
const postProcessCreateDevice = require('../deviceType/CepheidGeneXpert/postProcessCreateDevice')
const transformMergeResultPayload = require('../deviceType/CepheidGeneXpert/transformMergeResultPayload')
const preProcessMergeResult = require('../deviceType/CepheidGeneXpert/preProcessMergeResult')
const onResultLogged = require('../deviceType/CepheidGeneXpert/onResultLogged.js')
const getCustomFields = require('../deviceType/GxConnect/customFields/customFields')
const { extractCustomFieldsFromPayload } = require('../deviceType/GxConnect/extractCustomFieldsFromPayload')
const { identifyDevice } = require('../../deviceApi/gxConnect/identifyDevice')
const { findResult } = require('../result/geneXpert/resultIdentification/findResult_v1')

const gxconnectPlugin = {
  findResult,
  identifyDevice,
  postProcessUpdateDeviceConfiguration,
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
