const settings = require('../partner/Myanmar/settings')
const issueResolutions = require('../partner/Myanmar/issueResolutions')
const issueEscalations = require('../partner/Myanmar/issueEscalations')
const dataCategories = require('../partner/Myanmar/dataCategories')
const transformMergeResultPayload = require('../partner/Myanmar/transformMergeResultPayload')
const onResultLogged = require('../partner/Myanmar/onResultLogged')

const myanmarPlugin = {
  settings,
  issueResolutions,
  issueEscalations,
  dataCategories,
  transformMergeResultPayload,
  onResultLogged,
}

module.exports = {
  myanmarPlugin,
}
