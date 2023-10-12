const onResultLogged = require('../partner/Philippines/onResultLogged')
const issueTriggers = require('../partner/Philippines/issueTriggers')
const issueResolutions = require('../partner/Philippines/issueResolutionConditions')
const transformMergeResultPayload = require('../partner/Philippines/transformMergeResultPayload')
const settings = require('../partner/Philippines/settings')

const philippinesPlugin = {
  onResultLogged,
  issueTriggers,
  issueResolutions,
  transformMergeResultPayload,
  settings,
}

module.exports = {
  philippinesPlugin,
}
