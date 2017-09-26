const preProcessGetResult = require('./preProcessGetResult')
const postProcessMergeResult = require('./postProcessMergeResult')
const postProcessUpdateSite = require('./postProcessUpdateSite')
const onResultLogged = require('./onResultLogged')

module.exports = {
  preProcessGetResult,
  postProcessMergeResult,
  postProcessUpdateSite,
  onResultLogged,
}
