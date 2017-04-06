const _ = require('lodash')
const { query } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

function* getRolesForSelectList(request) {
  const { auth } = request
  const dataConstraints = yield getConstraints(auth.credentials)
  const partnersAndRoles = yield query('Get partners and roles for select lists')
    .from('Role as r')
    .rightOuterJoin('Partner as p', 'r.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .orderBy(['p.name', 'r.name'], 'asc')
    .select('p.id as partnerId', 'p.name as partnerName', 'r.id as roleId', 'r.name as roleName')

  const partners = _.map(
      _.uniqBy(partnersAndRoles, 'partnerId'),
      partnerRecord => ({
        id: partnerRecord.partnerId,
        name: partnerRecord.partnerName,
        roles: _.orderBy(_.map(
            _.filter(partnersAndRoles, { partnerId: partnerRecord.partnerId }),
            roleRecord => ({
              id: roleRecord.roleId,
              name: roleRecord.roleName
            })), 'name')
      }))

  return {
    ok: true,
    data: partners
  }
}

module.exports = {
  getRolesForSelectList
}
