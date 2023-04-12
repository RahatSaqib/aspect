const { getConstraints } = require('../../auth/constraints')

const { getInventoryOverviewList } = require('./db')

module.exports = async function (request) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const { total, data: rawData } = await getInventoryOverviewList(query, dataConstraints)

  const data = buildHierarchy(rawData)

  return { ok: true, total, length: data.length, data }
}

function buildHierarchy(rawData) {
  const data = []
  const map = new Map()

  rawData.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  rawData.forEach(item => {
    const parent = map.get(item.parentWareHouseId)
    if (parent) {
      parent.children.push(item)
    } else {
      data.push(item)
    }
  })

  return data
}

console.log('\x1b[1;36m', '🚀 ➜ file: getInventoryOverview.js:37 ➜ TODO:', 'Check this TODO')
// TODO: Need to show parent warehouse name in the UI
// Check that site edit allows changing parent warehouse (in dev is failing with existing siteId)
