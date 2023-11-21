const issueTriggers = require('../partner/SA_NHLS/issueTriggers')
const issueEscalations = require('../partner/SA_NHLS/issueEscalationConditions')
const issueResolutions = require('../partner/SA_NHLS/issueResolutionConditions')
const onResultLogged = require('../partner/SA_NHLS/onResultLogged')
const onGxAlertAuthenticated = require('../partner/SA_NHLS/onGxAlertAuthenticated')
const postProcessMergeResult = require('../partner/SA_NHLS/postProcessMergeResult')

const saNhlsPlugin = {
  issueTriggers,
  issueEscalations,
  issueResolutions,
  onResultLogged,
  onGxAlertAuthenticated,
  postProcessMergeResult,
}

module.exports = {
  saNhlsPlugin,
}
