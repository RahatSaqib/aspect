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

  return { ok: true, length: sites.length, data: { country } }
}

/**
 * Fills children sites and geographies on each geography, arrange them in a hierarchy
 * @param {*} geo - List of geographies
 * @param {*} sites - List of sites
 * @returns Hierachical list of geographies, with country ➜ state ➜ lga, where each node's children property also contains sites.
 */
function buildHierarchy(geo, sites) {
  const lgas = geo.filter(g => g.lgaId)
  lgas.forEach(g => {
    g.type = 'lga'
    const lgaSites = sites.filter(s => s.lgaId === g.lgaId)
    g.children = lgaSites
  })

  const states = geo.filter(g => g.stateId && !g.lgaId)
  states.forEach(g => {
    g.type = 'province'
    const stateSites = sites.filter(s => g.stateId === s.stateId)
    const stateLgas = lgas.filter(l => l.stateId === g.stateId)
    g.children = [...stateSites, ...stateLgas]
  })

  const country = geo.find(g => g.countryId && !g.stateId && !g.lgaId)
  country.type = 'country'
  const countrySites = sites.filter(s => country.countryId === s.countryId && !s.stateId && !s.lgaId)
  country.children = [...countrySites, ...states]

  return country
}

console.log('\x1b[1;36m', '🚀 ➜ file: getInventoryOverview.js:37 ➜ TODO:', 'Check this TODO')
// TODO: Need to show parent warehouse name in the Site Details page, open ticket.
// TODO: I'm not using parent warehouse, ask about it!!!!
