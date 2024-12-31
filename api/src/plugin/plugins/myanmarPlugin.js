const { extractCustomFieldsFromPayload } = require('../partner/Myanmar/extractCustomFieldsFromPayload')
const settings = require('../partner/Myanmar/settings')
const transformMergeResultPayload = require('../partner/Myanmar/transformMergeResultPayload')

const myanmarPlugin = {
  settings,
  transformMergeResultPayload,
  extractCustomFieldsFromPayload,
}

module.exports = {
  myanmarPlugin,
}
