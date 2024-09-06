const settings = require('../partner/Myanmar/settings')
const transformMergeResultPayload = require('../partner/Myanmar/transformMergeResultPayload')
const findResult = require('../result/geneXpert/resultIdentification/findResult_v1')

const myanmarPlugin = {
  settings,
  transformMergeResultPayload,
  findResult,
}

module.exports = {
  myanmarPlugin,
}
