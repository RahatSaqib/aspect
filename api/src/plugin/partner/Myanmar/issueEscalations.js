const { getEscalateOrResolveStatusForIssueStockout } = require('./utils')

async function escalateIssueStockout(knex, issue) {
  const status = await getEscalateOrResolveStatusForIssueStockout(knex, issue)
  return status.isEscalated
}
module.exports = {
  escalateIssueStockout,
}
