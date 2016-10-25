let Promise = require('bluebird')
let { query } = require('../db')

function* listOrganisationalUnitsForSelectList(request) {
  const {params} = request

  let organisationalUnits = yield query('Get organisational units for select list')
    .from('OrgUnit as o')
    .where({'o.partnerId': params.partnerId})
    .orderBy(['o.name'], 'asc')
    .select('o.id', 'o.name')

  return { ok: true, data: organisationalUnits }
}

module.exports = {
  listOrganisationalUnitsForSelectList
}
