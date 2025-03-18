const { getConstraints } = require('../../auth/constraints')
const getInventoryOverviewList = require('./db')
const { getAllGeographiesWithNames } = require('../../geography/service')

module.exports = async function (request) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const inventoryListQuery = getInventoryOverviewList(query, dataConstraints)

  const geographiesPromise = getAllGeographiesWithNames(request, dataConstraints)

  const [sites, geographies] = await Promise.all([inventoryListQuery, geographiesPromise])

  const country = buildHierarchy(geographies, sites)

  fillHierarchicalAggregations(country)

  return { ok: true, length: sites.length, data: { country } }
}

/**
 * Fills children sites and geographies on each geography, arrange geographies in a hierarchy.
 * @param {Array} geo - List of geographies.
 * @param {Array} sites - List of sites.
 * @returns Hierachical list of geographies, with country ➜ state ➜ lga, where each node's children property contains warehouses and labs.
 */
function buildHierarchy(geo, sites) {
  const [{ countryId }] = geo

  const states = geo.filter(g => g.stateId && !g.lgaId)
  const lgas = geo.filter(g => g.lgaId)

  // Add extra unique states and lgas to match sites with no state or lga associated
  lgas.push({ lgaId: 'NO_LGA', stateId: 'NO_STATE', countryId })
  lgas.push(...states.map(s => ({ lgaId: `STATE_${s.stateId}_NO_LGA`, stateId: s.stateId })))
  states.push({ stateId: 'NO_STATE', countryId })

  // Assign unique matching lga id and state id to sites with no state or lga associated
  sites.forEach(s => {
    if (!s.stateId && !s.lgaId) {
      s.lgaId = `NO_LGA`
      s.stateId = `NO_STATE`
    } else if (!s.lgaId) {
      s.lgaId = `STATE_${s.stateId}_NO_LGA`
    }
  })

  // Sort by showing first the warehouses and then the labs
  sites = sites.sort((a, b) => {
    if (a.type === b.type) return 0

    if (a.type === 'warehouse' && b.type === 'lab' && b.type === 'clinic') return -1

    return 1
  })

  // Build lgas childrens
  lgas.forEach(g => {
    g.type = 'lga'
    const lgaSites = sites.filter(
      s =>
        s.lgaId === g.lgaId &&
        s.stateId === g.stateId &&
        (['lab', 'clinic'].includes(s.type) ||
          // Only lga-level warehouses are going to be included in the site-level
          (s.type === 'warehouse' && s.lgaId !== 'NO_LGA' && s.lgaId !== `STATE_${s.stateId}_NO_LGA`))
    )

    g.children = reduceAuxiliarProperties(lgaSites)
  })

  // Build states childrens
  states.forEach(g => {
    g.type = 'state'
    const stateWarehouses = sites.filter(
      s => s.type === 'warehouse' && g.stateId === s.stateId && s.lgaId === `STATE_${s.stateId}_NO_LGA`
    )
    const stateLgas = lgas.filter(l => l.stateId === g.stateId)
    g.children = reduceAuxiliarProperties([...stateWarehouses, ...stateLgas])
  })

  // Build country childrens
  const country = geo.find(g => g.countryId && !g.stateId && !g.lgaId)
  country.type = 'country'
  const countryWarehouses = sites.filter(
    s => s.type === 'warehouse' && s.stateId === 'NO_STATE' && s.lgaId === 'NO_LGA'
  )
  country.children = reduceAuxiliarProperties([...countryWarehouses, ...states])

  return reduceItemAuxiliarProperties(country)
}

function fillHierarchicalAggregations(item) {
  switch (item.type) {
    case 'country':
    case 'state':
    case 'lga':
      item.quantity = 0
      item.usedLastSixMonths = 0
      item.usedInDateRange = 0
      item.dailyConsumptionRate = 0
      item.unreconciledQuantity = 0

      item.children
        .filter(site => site.type !== 'warehouse')
        .forEach(child => {
          fillHierarchicalAggregations(child)
          item.quantity += child.quantity
          item.unreconciledQuantity += child.unreconciledQuantity
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

function reduceAuxiliarProperties(array) {
  return array.map(item => reduceItemAuxiliarProperties(item))
}

function reduceItemAuxiliarProperties(item) {
  const reduced = { ...item }
  delete reduced.consumableId
  delete reduced.geographyId
  delete reduced.firstResultDateInLastSixMonths
  if (reduced.type === 'warehouse') {
    delete reduced.usedLastSixMonths
    delete reduced.usedInDateRange
  }
  return reduced
}
