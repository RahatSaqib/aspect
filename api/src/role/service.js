let { query } = require('../db')

function* listRolesForSelectList(request){
  const {partnerId, organisationalUnitId} = request.params
  const roles = yield query('Get roles for select list')
    .from('Role as r')
    .where({'r.partnerId': partnerId, 'r.orgUnitId': organisationalUnitId})
    .orderBy(['r.name'], 'asc')
    .select('r.id', 'r.name')

  return { ok: true, data: roles }
}

module.exports = {
  listRolesForSelectList
}
