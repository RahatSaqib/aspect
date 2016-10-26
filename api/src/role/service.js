const _ = require('lodash')
const { query, knex } = require('../db')

function* getRolesForSelectList(){
  const partnersOrganisationalUnitsAndRoles = yield query('Get partners, organisational units and roles for select lists')
    .from('Role as r')
    .leftJoin('OrgUnit as ou', 'r.orgUnitId', 'ou.id')
    .leftJoin('Partner as p', function () {
      this.on('ou.partnerId', 'p.id')
        .orOn(knex.raw('r.orgUnitId IS NULL AND r.partnerId = p.id'))
    })
    .orderBy(['p.name', 'ou.name', 'r.name'], 'asc')
    .select('p.id as partnerId', 'p.name as partnerName', 'ou.id as orgUnitId',
      'ou.name as orgUnitName', 'r.id as roleId', 'r.name as roleName')

  const partners = [{
    id: undefined,
    name: undefined,
    orgUnits: [{
      id: undefined,
      name: undefined,
      roles: _.orderBy(_.map(
        _.uniqBy(
          _.filter(partnersOrganisationalUnitsAndRoles,
            {partnerId: null, orgUnitId: null}),
          'roleId'), 'name'),
        function(roleRecord) {
          return {
            id: roleRecord.roleId,
            name: roleRecord.roleName
          }
        })
    }]}].concat(_.map(
      _.uniqBy(
        _.filter(partnersOrganisationalUnitsAndRoles,
          function(partnerRecord) {
            return partnerRecord.partnerId !== null
          }), 'partnerId'),
      function(partnerRecord) {
        return {
          id: partnerRecord.partnerId,
          name: partnerRecord.partnerName,
          orgUnits: [{
            id: undefined,
            name: undefined,
            roles: _.orderBy(_.map(
              _.filter(partnersOrganisationalUnitsAndRoles,
                {partnerId: partnerRecord.partnerId, orgUnitId: null}),
              function(roleRecord) {
                return {
                  id: roleRecord.roleId,
                  name: roleRecord.roleName
                }
              }), 'name')
          }].concat(_.orderBy(_.map(
            _.filter(partnersOrganisationalUnitsAndRoles,
              function (orgUnitRecord) {
                return orgUnitRecord.orgUnitId !== null &&
                  orgUnitRecord.partnerId === partnerRecord.partnerId
              }),
            function(orgUnitRecord) {
              return {
                id: orgUnitRecord.orgUnitId,
                name: orgUnitRecord.orgUnitName,
                roles: _.orderBy(_.map(
                  _.filter(partnersOrganisationalUnitsAndRoles,
                    {orgUnitId: orgUnitRecord.orgUnitId}),
                  function(roleRecord) {
                    return {
                      id: roleRecord.roleId,
                      name: roleRecord.roleName
                    }
                  }), 'name')
              }
            }), 'name'))
        }
      }))

  return {
    ok: true,
    data: partners
  }
}

module.exports = {
  getRolesForSelectList
}
