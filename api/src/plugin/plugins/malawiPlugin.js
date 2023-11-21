const settings = require('../partner/Malawi/settings')
const transformNewDevicePayload = require('../partner/Malawi/transformNewDevicePayload')
const preProcessGetResult = require('../partner/Malawi/preProcessGetResult')
const excludeResult = require('../partner/Malawi/excludeResult')
const postProcessMergeResult = require('../partner/Malawi/postProcessMergeResult')
const postProcessUpdateSite = require('../partner/Malawi/postProcessUpdateSite')
const onResultLogged = require('../partner/Malawi/onResultLogged')

const malawiPlugin = {
  settings,
  transformNewDevicePayload,
  preProcessGetResult,
  excludeResult,
  postProcessMergeResult,
  postProcessUpdateSite,
  onResultLogged,
}

module.exports = {
  malawiPlugin,
}
