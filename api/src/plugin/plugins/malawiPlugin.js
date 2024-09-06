const settings = require('../partner/Malawi/settings')
const excludeResult = require('../partner/Malawi/excludeResult')
const findResult = require('../result/geneXpert/resultIdentification/findResult_v1')

const malawiPlugin = {
  settings,
  excludeResult,
  findResult,
}

module.exports = {
  malawiPlugin,
}
