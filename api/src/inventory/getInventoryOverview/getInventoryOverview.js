const { getConstraints } = require('../../auth/constraints')
const getInventoryOverviewList = require('./db')
const { getAllWithNames } = require('../../geography/service')

module.exports = async function (request) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const inventoryListPromise = getInventoryOverviewList(query, dataConstraints)

  const geographiesPromise = getAllWithNames(request, dataConstraints)

  const [sites, geographies] = await Promise.all([inventoryListPromise, geographiesPromise])

  const country = buildHierarchy(geographies, sites)

  addAggregations(country)

  return { ok: true, length: sites.length, data: { country } }
}

/**
 * Fills children sites and geographies on each geography, arrange geographies in a hierarchy.
 * @param {Array} geo - List of geographies.
 * @param {Array} sites - List of sites.
 * @returns Hierachical list of geographies, with country ➜ state ➜ lga, where each node's children property contains warehouses and labs.
 */
function buildHierarchy(geo, sites) {
  const lgas = geo.filter(g => g.lgaId)
  lgas.forEach(g => {
    g.type = 'lga'
    const lgaLabs = sites.filter(s => s.lgaId === g.lgaId && s.type === 'lab')
    deleteAuxiliarProperties(lgaLabs)
    g.children = lgaLabs
  })

  const states = geo.filter(g => g.stateId && !g.lgaId)
  states.forEach(g => {
    g.type = 'state'
    const stateSites = sites
      .filter(s => g.stateId === s.stateId && !s.lgaId)
      .sort((a, b) => ['warehouse', 'lab'].indexOf(a.type) > ['warehouse', 'lab'].indexOf(b.type))
    const stateLgas = lgas.filter(l => l.stateId === g.stateId)
    deleteAuxiliarProperties([...stateSites, ...stateLgas])
    g.children = [...stateSites, ...stateLgas]
  })

  const country = geo.find(g => g.countryId && !g.stateId && !g.lgaId)
  country.type = 'country'
  const countrySites = sites.filter(s => country.countryId === s.countryId && !s.stateId && !s.lgaId)
  deleteAuxiliarProperties([country, ...countrySites])
  country.children = [...countrySites, ...states]

  return country
}

function addAggregations(item) {
  switch (item.type) {
    case 'country':
    case 'state':
    case 'lga':
      item.quantity = 0
      item.usedLastSixMonths = 0
      item.usedInDateRange = 0
      item.dailyConsumptionRate = 0

      item.children.forEach(child => {
        addAggregations(child)
        item.quantity += child.quantity
        if (child.usedLastSixMonths) {
          item.usedLastSixMonths = parseFloat((item.usedLastSixMonths + child.usedLastSixMonths).toFixed(2))
        }
        if (child.usedInDateRange) {
          item.usedInDateRange = parseFloat((item.usedInDateRange + child.usedInDateRange).toFixed(2))
        }
        if (child.dailyConsumptionRate) {
          item.dailyConsumptionRate = parseFloat((item.dailyConsumptionRate + child.dailyConsumptionRate).toFixed(2))
        }
        if (child.daysOfInventoryLeft) {
          item.daysOfInventoryLeft = Math.min(
            (item.daysOfInventoryLeft = parseFloat(item.daysOfInventoryLeft + child.daysOfInventoryLeft.toFixed(2))),
            child.daysOfInventoryLeft
          )
        }
      })
      if (!item.daysOfInventoryLeft) {
        item.daysOfInventoryLeft = 0
      }
      break
    case 'warehouse':
      break
    default:
      break
  }
}

function deleteAuxiliarProperties(items) {
  items.forEach(s => {
    delete s.consumableId
    delete s.geographyId
    delete s.stateId
    delete s.countryId
    delete s.lgaId
    delete s.firstResultDateInLastSixMonths
    if (s.type === 'warehouse') {
      delete s.usedLastSixMonths
      delete s.usedInDateRange
    }
  })
}
