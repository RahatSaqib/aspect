const postProcessCreateDevice = require('../deviceType/CepheidGeneXpert/postProcessCreateDevice')
const transformMergeResultPayload = require('../deviceType/CepheidGeneXpert/transformMergeResultPayload')
const preProcessMergeResult = require('../deviceType/CepheidGeneXpert/preProcessMergeResult')
const onResultLogged = require('../deviceType/CepheidGeneXpert/onResultLogged.js')
const { extractCustomFieldsFromPayload } = require('../deviceType/GxConnect/extractCustomFieldsFromPayload')
const { findResult } = require('../result/geneXpert/resultIdentification/findResult_v1')
const { identifyDevice } = require('../deviceType/CepheidGeneXpert/identifyDevice')

const gxconnectPlugin = {
  findResult,
  identifyDevice,
  postProcessCreateDevice,
  transformMergeResultPayload,
  preProcessMergeResult,
  onResultLogged,
  extractCustomFieldsFromPayload,
}

module.exports = {
  gxconnectPlugin,
}
