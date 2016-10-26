const Promise = require('bluebird')
let _ = require('lodash')
const { query, knex, filterParams, sortPageParams } = require('../db')
let userService = require('../auth/service')

function* listPeople(request){
  const {query} = request

  const personQuery = knex('Person as p')
    .leftOuterJoin('State as s', 'p.stateId', 's.id')
    .leftOuterJoin('Lga as l', 'p.lgaId', 'l.id')
    .modify(filterParams, query, {
      countryId: 'p.countryId',
      stateId: 'p.stateId',
      lgaId: 'p.lgaId',
      contactNameOrEmail: ['p.name', 'p.email', 'p.email2']
    })

  // get total count for paging
  const getCount = personQuery.clone()
    .count('p.id as count')
    .first()

  // TODO What do we do when a user has many roles? (currently delited list)
  const getRoleNames = knex('UserRole as ur')
    .innerJoin('Role as r', 'ur.roleId', 'r.id')
    .where('ur.userId', '=', knex.raw('p.userId'))
    .select(knex.raw('group_concat(r.name separator "; ")'))
    .as('level')

  // get rows
  const getItems = personQuery.clone()
    .modify(sortPageParams, query, 'p.name')
    .select('p.id', 'p.name', getRoleNames,
      's.name as state', 'l.name as lga')

  // return result when both queries are finished
  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  return {ok: true, total, data, length: data.length}
}

function getPersonDetails(personId) {
  return query('Get person details').from('Person as p')
    .leftJoin('User as u', 'p.userId', 'u.id')
    .leftOuterJoin('State as s', 'p.stateId', 's.id')
    .leftOuterJoin('Country as c', 'p.countryId', 'c.id')
    .leftOuterJoin('Lga as l', 'p.lgaId', 'l.id')
    .where({'p.id': personId})
    .first('p.id', 'p.userId', 'u.name as username', 'p.name', 'p.title', 'p.email', 'p.email2',
      'p.phone', 'p.cell', 'p.countryId', 'p.stateId', 'p.lgaId', 'p.zip', 'p.timezone', 'p.culture',
      'p.notes', 'p.lastPartnerId', 'p.hidePatientId', 'p.hideSampleId', 'p.hideNotes',
      'c.name as country', 's.name as stateName', 'l.name as lgaName')
}

function* showPerson(request) {
  const {params} = request

  const personDetails = yield getPersonDetails(params.personId),
    rolesForUser = personDetails.userId ? yield userService.getRolesForUser(personDetails.userId) : []

  personDetails.roles = _.map(rolesForUser, 'roleId')
  if(!_.isEmpty(personDetails.roles)) {
    const partnerInfo = yield query('Get Partner ID and Organisational Unit ID for Role')
      .from('Role as r')
      .where({'r.id': personDetails.roles[0]})
      .first('r.partnerId', 'r.orgUnitId')
    personDetails.partnerId = partnerInfo.partnerId
    personDetails.orgUnitId = partnerInfo.orgUnitId
  } else {
    personDetails.partnerId = null
    personDetails.orgUnitId = null
  }
  return {ok: true, data: personDetails}
}

function* savePerson(request, updatablePersonFields) {
  const {params, payload} = request

  // TODO: check access level permissions
  const currentlyLoggedInUser = yield userService.getUser(request.auth.credentials.name)

  const personDetails = yield getPersonDetails(params.personId),
    changedFields = _.reduce(payload, function(result, value, key) {
      if(_.includes(updatablePersonFields, key) && key in personDetails &&
        personDetails[key] != value) {
        result[key] = value
      }
      return result
    }, {})

  //Update record if any values have changed
  if(!_.isEmpty(changedFields)) {
    changedFields.updatedOn = new Date()
    changedFields.updatedBy = currentlyLoggedInUser.id

    yield query('Save person details').from('Person as p')
      .where({'p.id': personDetails.id})
      .update(changedFields)
  }

  return yield* showPerson(request)
}

function* updatePerson(request) {
  return yield* savePerson(request, ['name', 'title', 'email', 'email2', 'phone', 'cell', 'countryId',
    'stateId', 'lgaId', 'zip', 'notes'])
}

function* updatePersonUserPreferences(request) {
  return yield* savePerson(request, ['timezone', 'culture'])
}

module.exports = {
  listPeople,
  showPerson,
  updatePerson,
  updatePersonUserPreferences
}
