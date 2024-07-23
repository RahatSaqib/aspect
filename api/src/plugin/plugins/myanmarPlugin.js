const settings = require('../partner/Myanmar/settings')
const transformMergeResultPayload = require('../partner/Myanmar/transformMergeResultPayload')

const myanmarPlugin = {
  settings,
  transformMergeResultPayload,
}

module.exports = {
  myanmarPlugin,
}
