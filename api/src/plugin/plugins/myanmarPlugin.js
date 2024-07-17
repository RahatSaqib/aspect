const { dataCategories } = require('../partner/Myanmar/dataCategories')
const settings = require('../partner/Myanmar/settings')
const transformMergeResultPayload = require('../partner/Myanmar/transformMergeResultPayload')

const myanmarPlugin = {
  settings,
  dataCategories,
  transformMergeResultPayload,
}

module.exports = {
  myanmarPlugin,
}
