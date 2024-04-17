const settings = require('../partner/Pakistan/settings')
const inventoryStrategy = require('../partner/Pakistan/inventoryStrategy')
const findResult = require('../result/geneXpert/resultIdentification/findResult_v1')

const pakistanPlugin = {
  settings,
  inventoryStrategy,
  findResult,
}

module.exports = {
  pakistanPlugin,
}
