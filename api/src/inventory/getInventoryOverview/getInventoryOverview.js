const { getConstraints } = require('../../auth/constraints')
const getInventoryOverviewList = require('./db')
const { getAllGeographiesWithNames } = require('../../geography/common/db')
const { SITE_TYPE_EXTERNAL_IDS } = require('../../shared/constants')

module.exports = async function (request) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const inventoryListQuery = getInventoryOverviewList(query, dataConstraints)
  const geographyListQuery = getAllGeographiesWithNames(dataConstraints)

  const [sites, geographies] = await Promise.all([inventoryListQuery, geographyListQuery])

  const country = buildHierarchy(geographies, sites)

  fillHierarchicalAggregations(country)

  return { ok: true, length: sites.length, data: { country } }
}

/**
 * Fills children sites and geographies on each geography, arrange geographies in a hierarchy.
 * @param {Array} geographies - List of geographies.
 * @param {Array} sites - List of sites.
 * @returns Hierachical list of geographies, with country ➜ state ➜ lga, where each node's children property contains warehouses and labs.
 */
function buildHierarchy(geographies, sites) {
  const { country, states, lgas } = processGeographies(geographies)
  const sitesWithDefaults = processSites(sites)

  const hierarchy = {
    ...reduceItemAuxiliarProperties(country),
    type: 'country',
    children: [...getCountryWarehouses(sitesWithDefaults), ...buildStateHierarchy(states, lgas, sitesWithDefaults)].map(
      reduceItemAuxiliarProperties
    ),
  }

  return hierarchy
}

function buildStateHierarchy(states, lgas, sites) {
  return states.map(state => ({
    ...state,
    type: 'state',
    children: [...getStateWarehouses(state.stateId, sites), ...buildLgaHierarchy(state.stateId, lgas, sites)].map(
      reduceItemAuxiliarProperties
    ),
  }))
}

function buildLgaHierarchy(stateId, lgas, sites) {
  return lgas
    .filter(lga => lga.stateId === stateId)
    .map(lga => ({
      ...lga,
      type: 'lga',
      children: getLgaSites(lga, sites).map(reduceItemAuxiliarProperties),
    }))
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
        .filter(site => site.type !== SITE_TYPE_EXTERNAL_IDS.WAREHOUSE)
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
    case SITE_TYPE_EXTERNAL_IDS.WAREHOUSE:
      break
    default:
      break
  }
}

function processGeographies(geographies) {
  const [country] = geographies
  const states = []
  geographies.forEach(g => {
    if (!states.some(item => item.stateId === g.stateId)) {
      states.push({ countryId: g.countryId, state: g.state, stateId: g.stateId })
    }
  })
  const lgas = geographies.filter(g => g.lgaId)

  // Add extra unique states and lgas to match sites with no state or lga associated
  return {
    country: { countryId: country.countryId, country: country.country },
    states: [...states, { stateId: 'NO_STATE', countryId: country.countryId }],
    lgas: [
      ...lgas,
      { lgaId: 'NO_LGA', stateId: 'NO_STATE', countryId: country.countryId },
      ...states.map(s => ({ lgaId: `STATE_${s.stateId}_NO_LGA`, stateId: s.stateId, countryId: s.countryId })),
    ],
  }
}

function processSites(sites) {
  const sitesWithDefaults = sites.map(site => ({
    ...site,
    stateId: site.stateId || `NO_STATE`,
    lgaId: site.lgaId || (site.stateId ? `STATE_${site.stateId}_NO_LGA` : `NO_LGA`),
  }))

  return sitesWithDefaults.sort((a, b) => {
    if (a.type === b.type) return 0
    if (a.type === SITE_TYPE_EXTERNAL_IDS.WAREHOUSE) return -1
    return 1
  })
}

function getCountryWarehouses(sites) {
  return sites.filter(
    s => s.type === SITE_TYPE_EXTERNAL_IDS.WAREHOUSE && s.stateId === 'NO_STATE' && s.lgaId === 'NO_LGA'
  )
}

function getStateWarehouses(stateId, sites) {
  return sites.filter(
    s => s.type === SITE_TYPE_EXTERNAL_IDS.WAREHOUSE && stateId === s.stateId && s.lgaId === `STATE_${s.stateId}_NO_LGA`
  )
}

function getLgaSites(lga, sites) {
  return sites.filter(
    s =>
      s.lgaId === lga.lgaId &&
      s.stateId === lga.stateId &&
      ([SITE_TYPE_EXTERNAL_IDS.LAB, SITE_TYPE_EXTERNAL_IDS.CLINIC].includes(s.type) ||
        // Only lga-level warehouses are going to be included in the site-level
        (s.type === SITE_TYPE_EXTERNAL_IDS.WAREHOUSE &&
          s.lgaId !== 'NO_LGA' &&
          s.lgaId !== `STATE_${s.stateId}_NO_LGA`))
  )
}

function reduceItemAuxiliarProperties(item) {
  const reduced = { ...item }
  delete reduced.consumableId
  delete reduced.geographyId
  delete reduced.firstResultDateInLastSixMonths
  if (reduced.type === SITE_TYPE_EXTERNAL_IDS.WAREHOUSE) {
    delete reduced.usedLastSixMonths
    delete reduced.usedInDateRange
  }
  return reduced
}
