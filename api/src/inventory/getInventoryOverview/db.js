const getInventorySitesQuery = require('../common/db')

module.export = async function (dataConstraints, query) {
  const siteQuery = getInventorySitesQuery(dataConstraints, query)

  const data = await siteQuery.select('s.parentWareHouseId')

  return data
}
