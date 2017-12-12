const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const { query, knex, filterParams, sortPageParams } = require('../db')
const userService = require('../auth/service')
const { transformGeographyFromUpdates } = require('../geography/service')

function* listPeople(request) {
  const { query } = request

  const personQuery = knex('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftOuterJoin('State as s', 'g.stateId', 's.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      contactNameOrEmail: ['p.name', 'p.email', 'p.email2'],
    })

  // get total count for paging
  const getCount = personQuery
    .clone()
    .count('p.id as count')
    .first()

  const getJobFunctionNames = knex('Job as j')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .where('j.personId', '=', knex.raw('p.id'))
    .select(knex.raw('group_concat(jf.name separator "; ")'))
    .as('level')

  // get rows
  const getItems = personQuery
    .clone()
    .modify(sortPageParams, query, 'p.name')
    .select(
      'p.id',
      'p.name',
      getJobFunctionNames,
      's.name as state',
      'l.name as lga'
    )

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  return { ok: true, total, data, length: data.length }
}

function getPersonDetails(personId) {
  return query('Get person details')
    .from('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftJoin('User as u', 'p.userId', 'u.id')
    .leftOuterJoin('State as s', 'g.stateId', 's.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where({ 'p.id': personId })
    .first(
      'p.id',
      'p.userId',
      'u.name as username',
      'p.name',
      'p.title',
      'p.email',
      'p.email2',
      'p.phone',
      'p.cell',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'p.zip',
      'p.timezone',
      'p.culture',
      'p.notes',
      'p.lastPartnerId',
      'p.hidePatientId',
      'p.hideSampleId',
      'p.hideNotes',
      'c.name as country',
      's.name as stateName',
      'l.name as lgaName'
    )
}

function* showPerson(request) {
  const { params } = request

  const personDetails = yield getPersonDetails(params.personId)
  if (_.isEmpty(personDetails)) {
    return Boom.notFound()
  }

  if (personDetails.userId == null) {
    personDetails.jobFunctions = []
  } else {
    const jobFunctionsForUser = yield query('Get job functions for user')
      .from('Job as j')
      .innerJoin('JobFunction as jf', 'jf.id', 'j.jobFunctionId')
      .innerJoin('Person as ps', 'ps.id', 'j.personId')
      .where({ 'ps.userId': personDetails.userId })
      .select('ps.userId', 'j.jobFunctionId', 'jf.partnerId')
    personDetails.jobFunctions = _.map(jobFunctionsForUser, 'jobFunctionId')
    if (jobFunctionsForUser.length > 0) {
      personDetails.partnerId = jobFunctionsForUser[0].partnerId
    }
  }

  return { ok: true, data: personDetails }
}

function* savePerson(request, updatablePersonFields) {
  const { params, payload } = request

  // TODO: check access level permissions
  const currentlyLoggedInUser = yield userService.getUser(
    request.auth.credentials.name
  )

  const personDetails = yield getPersonDetails(params.personId)
  if (_.isEmpty(personDetails)) {
    return Boom.notFound()
  }
  const changedFields = _.reduce(
    payload,
    (result, value, key) => {
      if (
        _.includes(updatablePersonFields, key) &&
        key in personDetails &&
        personDetails[key] !== value
      ) {
        result[key] = value
      }
      return result
    },
    {}
  )

  // Update record if any values have changed
  const changedPersonFields = yield* transformGeographyFromUpdates(
    changedFields
  )
  if (!_.isEmpty(changedPersonFields)) {
    if (
      changedFields.countryId &&
      personDetails.lastCountryId !== changedFields.countryId
    ) {
      changedPersonFields.lastCountryId = changedFields.countryId
    }

    changedFields.updatedOn = new Date()
    changedFields.updatedBy = currentlyLoggedInUser.id

    yield query('Save person details')
      .from('Person as p')
      .where({ 'p.id': personDetails.id })
      .update(changedPersonFields)
  }

  return yield* showPerson(request)
}

function* updatePerson(request) {
  return yield* savePerson(request, [
    'name',
    'title',
    'email',
    'email2',
    'phone',
    'cell',
    'countryId',
    'stateId',
    'lgaId',
    'zip',
    'notes',
    'lastPartnerId',
  ])
}

function* updatePersonUserPreferences(request) {
  return yield* savePerson(request, ['timezone', 'culture'])
}

module.exports = {
  listPeople,
  showPerson,
  updatePerson,
  updatePersonUserPreferences,
}
