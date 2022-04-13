const _ = require('lodash')
const Boom = require('boom')
const { query, knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const userService = require('../auth/service')
const { transformGeographyFromUpdates } = require('../geography/service')
const {
  clientTypes,
  revokeUsersToken,
  lockedOutUser,
} = require('../auth/service')
const { getPeopleBase } = require('../shared/utilsPerson')

async function listPeople(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const { geographicLevel, tags } = query

  const personQuery = getPeopleBase()
    .leftJoin('Geography as jcg', 'jc.geographyId', 'jcg.id')
    .leftJoin('PersonTag as pt', 'p.id', 'pt.personId')
    .leftJoin('Tag as t', 'pt.tagId', 't.id')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      contactNameOrEmail: ['p.name', 'p.email', 'p.email2'],
      siteId: 'jc.siteId',
    })
    .modify(addConstraints, dataConstraints, { geography: 'g', site: 's' })
    .where(qb => {
      if (dataConstraints.partner.id) {
        qb.whereNull('p.partnerId').orWhere(
          'p.partnerId',
          dataConstraints.partner.id
        )
      }
    })

  switch (geographicLevel) {
    case 'state':
      personQuery.andWhere(qb =>
        qb.whereNotNull('jcg.stateId').whereNull('jcg.lgaId')
      )
      break
    case 'lga':
      personQuery.andWhere(qb =>
        qb.whereNotNull('jcg.lgaId').whereNull('jc.siteId')
      )
      break
    case 'lab':
      personQuery.andWhere(qb => qb.whereNotNull('jc.siteId'))
      break
    default:
      break
  }

  if (tags) {
    personQuery.andWhere(qb => qb.whereIn('t.title', tags))
  }

  // get total count for paging
  const getCount = personQuery
    .clone()
    .select(knex.raw('count(distinct p.id) as total'))
    .first()

  const getJobFunctionNames = knex('Job as j')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .where('j.personId', '=', knex.raw('p.id'))
    .select(knex.raw('group_concat(jf.name separator "; ")'))
    .as('level')
  const getTags = knex('Tag as t')
    .innerJoin('PersonTag as pt', 't.id', 'pt.tagId')
    .innerJoin('Partner as prt', 't.partnerId', 'prt.id')
    .where('pt.personId', '=', knex.raw('p.id'))
    .modify(addConstraints, dataConstraints, { partner: 'prt' })
    .select(knex.raw(`group_concat(t.title separator ';')`))
    .as('tags')

  // get rows
  const getItems = personQuery
    .clone()
    .modify(sortPageParams, query, 'p.name')
    .groupBy('p.id')
    .select(
      'p.id',
      'p.name',
      getJobFunctionNames,
      'st.name as state',
      'l.name as lga',
      's.name as site',
      getTags
    )

  // return result when both queries are finished
  const [{ total }, data] = await Promise.all([getCount, getItems])

  const personIds = data.map(({ id }) => id)
  const personTags = await knex('Tag as t')
    .innerJoin('PersonTag as pt', 't.id', 'pt.tagId')
    .innerJoin('Partner as prt', 't.partnerId', 'prt.id')
    .whereIn('pt.personId', personIds)
    .modify(addConstraints, dataConstraints, { partner: 'prt' })
    .select('t.title as tagName', 't.id as tagId', 'pt.personId')
  data.forEach(item => {
    item.tagDetails = personTags
      .filter(personTag => item.id === personTag.personId)
      .map(({ tagName, tagId }) => ({ tagName, tagId }))
  })

  return { ok: true, total, data, length: data.length }
}

async function listPeopleForSelectList(request) {
  request.query.size = 'all'
  const response = await listPeople(request)
  return response
}

async function availableContacts(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await getPeopleBase()
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .groupBy('p.id')
    .select('p.name', 'p.id')
  return { ok: true, data }
}

async function assignContact(request) {
  const { siteId, personDetails, site } = await validateContact(request)

  if (_.isEmpty(personDetails) || _.isEmpty(site)) {
    return Boom.notFound()
  }

  let { jobId } = personDetails

  if (!jobId) {
    const { id: jobFunctionIdDefault } = await knex('JobFunction')
      .where({ name: 'Lab User' })
      .first('id')
    ;[jobId] = await knex('Job').insert({
      personId: personDetails.id,
      jobFunctionId: jobFunctionIdDefault,
    })
  }

  const newJobContext = { jobId, siteId }

  const existingJobContext = await knex('JobContext')
    .where(newJobContext)
    .whereNull('assayTypeId')
    .whereNull('assayId')
    .whereNull('deviceTypeId')
    .whereNull('diseaseId')
    .first()
  if (existingJobContext) {
    return Boom.conflict('Contact is already assigned to site')
  }
  const response = await knex('JobContext').insert(newJobContext)
  if (response) return { ok: true, data: await siteContacts(siteId) }
}

async function unAssignContact(request) {
  const { siteId, personDetails, site } = await validateContact(request)

  if (_.isEmpty(personDetails) || _.isEmpty(site)) {
    return Boom.notFound()
  }

  const contact = { jobId: personDetails.jobId, siteId }
  const jcRecord = await knex('JobContext')
    .where(contact)
    .whereNull('assayTypeId')
    .whereNull('assayId')
    .whereNull('deviceTypeId')
    .whereNull('diseaseId')
    .first()
  if (!jcRecord) {
    return Boom.notFound()
  }
  await knex('JobContext').where(contact).del()

  return { ok: true, data: await siteContacts(siteId) }
}

function getSite(siteId, dataConstraints) {
  return query('Get site to add contact to')
    .from('Site as s')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { geography: 'g', site: 's' })
    .where('s.id', '=', siteId)
}

function siteContacts(id) {
  return knex('JobContext as jc')
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    .innerJoin('Person as p', 'j.personId', 'p.id')
    .where('jc.siteId', id)
    .select('p.name', 'p.id')
}

async function validateContact(request) {
  const {
    params: { siteId },
    payload: { id },
    auth,
  } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const site = await getSite(siteId, dataConstraints)

  const personDetails = await getPersonDetails(id).modify(
    addConstraints,
    dataConstraints,
    { geography: 'g' }
  )

  return {
    siteId,
    site,
    personDetails,
  }
}

function getPersonDetails(personId) {
  return query('Get person details')
    .from('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftJoin('User as u', 'p.userId', 'u.id')
    .leftOuterJoin('State as s', 'g.stateId', 's.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin('Job as j', 'p.id', 'j.personId')
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
      'g.id as geographyId',
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
      'l.name as lgaName',
      'u.lockedOut as userLockedOut',
      'p.canLogIn',
      'j.id as jobId'
    )
}

async function showPerson(request) {
  const { params } = request

  const personDetails = await getPersonDetails(params.personId)
  if (_.isEmpty(personDetails)) {
    return Boom.notFound()
  }

  if (personDetails.userId == null) {
    personDetails.jobFunctions = []
  } else {
    const jobFunctionsForUser = await query('Get job functions for user')
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

async function savePerson(request, updatablePersonFields) {
  const { params, payload } = request

  _.mapKeys(payload, (value, key) => {
    if (value === '') {
      _.set(payload, `${key}`, null)
    }
  })

  // TODO: check access level permissions
  const currentlyLoggedInUser = await userService.getUser(
    request.auth.credentials.name
  )

  const personDetails = await getPersonDetails(params.personId)
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

  const changedPersonFields = await transformGeographyFromUpdates(changedFields)
  if (!_.isEmpty(changedPersonFields)) {
    if (
      changedFields.countryId &&
      personDetails.lastCountryId !== changedFields.countryId
    ) {
      changedPersonFields.lastCountryId = changedFields.countryId
    }

    changedFields.updatedOn = new Date()
    changedFields.updatedBy = currentlyLoggedInUser.id
    await query('Save person details')
      .from('Person as p')
      .where({ 'p.id': personDetails.id })
      .update(changedPersonFields)
  }

  if (Object.prototype.hasOwnProperty.call(changedFields, 'canLogIn')) {
    revokeUsersToken(personDetails.userId, !changedPersonFields.canLogIn)
    lockedOutUser(personDetails.userId, !changedPersonFields.canLogIn)
  }

  const response = await showPerson(request)
  return response
}

async function createPerson(request) {
  const { payload } = request
  const { name } = payload

  _.mapKeys(payload, (value, key) => {
    if (value === '') {
      _.set(payload, `${key}`, null)
    }
  })

  // if user with specified 'name' exists - return Boom
  const person = await knex('Person').where({ name }).first()
  if (person) {
    const err = Boom.conflict('Person with requested name already exists', {
      errorKeyCode: 'personNameExist',
    })
    err.output.payload.data = err.data
    return err
  }

  const currentlyLoggedInUser = await userService.getUser(
    request.auth.credentials.name
  )

  const changedFields = {
    // 'payload' contains at least one required field - 'name'
    ...payload,
    // add other required fields
    ..._.pick(currentlyLoggedInUser, ['timezone', 'culture']),
    createdOn: new Date(),
    updatedOn: new Date(),
    createdBy: currentlyLoggedInUser.id,
    updatedBy: currentlyLoggedInUser.id,
  }

  const changedPersonFields = await transformGeographyFromUpdates(changedFields)
  if (changedFields.countryId) {
    changedPersonFields.lastCountryId = changedFields.countryId
  }

  const [personId] = await knex('Person').insert(changedPersonFields)
  const personDetails = await getPersonDetails(personId)
  personDetails.jobFunctions = []

  return { ok: true, data: personDetails }
}

async function updatePerson(request) {
  return savePerson(request, [
    'name',
    'title',
    'email',
    'email2',
    'phone',
    'cell',
    'culture',
    'countryId',
    'stateId',
    'lgaId',
    'zip',
    'notes',
    'lastPartnerId',
    'timezone',
    'tags',
    'canLogIn',
    'hidePatientId',
    'hideSampleId',
    'hideNotes',
  ])
}

async function updatePersonUserPreferences(request) {
  const response = await savePerson(request, ['timezone', 'culture'])
  return response
}

async function listRefreshTokens(request) {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const tokenQuery = knex('RefreshToken as r')
    .innerJoin('Person as p', 'r.userId', 'p.userId')
    .leftJoin('Partner as prt', 'p.lastPartnerId', 'prt.id')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .where({ clientType: clientTypes.app })
    .modify(addConstraints, dataConstraints, { partner: 'prt', geography: 'g' })

  const getCount = knex
    .from(
      tokenQuery
        .clone()
        .select(knex.raw("CONCAT(p.name, ':', r.clientName) as id"))
        .as('reporterIds')
    )
    .countDistinct('id as count')
    .first()

  const getItems = tokenQuery
    .clone()
    .modify(sortPageParams, query, 'user')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      assayId: 'rt.assayId',
      treatmentStatusId: 'rts.id',
      contactNameOrEmail: ['p.name', 'p.email', 'p.email2'],
      deviceName: 'r.clientName',
      revoked: 'r.revoked',
      diseaseId: 'dis.id',
    })
    .leftJoin('ResultDownloadLog as rdl', queryBuilder => {
      queryBuilder.on('rdl.createdBy', 'r.userId')
      if (query.minDate) {
        queryBuilder.andOn(
          'rdl.createdOn',
          '>=',
          knex.raw('?', [query.minDate])
        )
      }
      if (query.maxDate) {
        queryBuilder.andOn(
          'rdl.createdOn',
          '<=',
          knex.raw('?', [query.maxDate])
        )
      }
    })
    .leftJoin('Result as rt', 'rt.id', 'rdl.resultId')
    .leftJoin('Assay as a', 'a.id', 'rt.assayId')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'rtsl.id',
      'rt.treatmentStatusLogId'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rts.id',
      'rtsl.resultTreatmentStatusId'
    )
    .leftJoin(
      'ResultWorkflowLog as rwl',
      'rwl.id',
      'rt.resultWorkflowStatusLogId'
    )
    .leftJoin(
      'ResultWorkflowStatus as rws',
      'rws.id',
      'rwl.resultWorkflowStatusId'
    )
    .leftJoin('ResultCategoryAssay as rca', queryBuilder => {
      queryBuilder
        .on('rca.resultCategoryId', 'rt.resultCategory1')
        .andOn('rca.assayId', 'rt.assayId')
    })
    .groupBy('p.name', 'r.clientName')
    .select(
      knex.raw("CONCAT(p.name, ':', r.clientName) as id"),
      'p.name as user',
      'r.clientName as deviceName',
      'r.createdOn',
      'r.revoked',
      knex.raw(
        'greatest(max(ifnull(r.updatedOn, r.createdOn)), (select max(all_rdl.createdOn) from ResultDownloadLog as all_rdl WHERE all_rdl.createdBy = r.userId)) as lastSeen'
      ),
      knex.raw(
        "sum(case rws.externalId when 'Acknowledged' then 1 else 0 end)/sum(case when rca.requiresTreatment = '1' then 1 else 0 end) as acknowledgedRatio"
      ),
      knex.raw(
        "sum(case when rts.externalId = 'OnTreatment' AND rca.requiresTreatment = '1' then 1 else 0 end)/sum(case when rca.requiresTreatment = '1' then 1 else 0 end) as confirmFollowUpRatio"
      ),
      knex.raw(
        "sum(case when rts.externalId = 'OnTreatment' AND rca.requiresTreatment = '1' then 1 else 0 end) as totalOnTreatment"
      ),
      knex.raw('count(distinct rdl.resultId) as delivered'),
      knex.raw(
        "sum(case when rca.requiresTreatment = '1' then 1 else 0 end) as requiresFollowUp"
      )
    )
    .distinct()
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

async function updateRefreshToken(request) {
  const { params, payload } = request
  const selectedToken = await knex('RefreshToken')
    .where('clientId', params.refreshTokenId)
    .update({
      revoked: payload.revoked,
    })

  if (selectedToken !== 1) {
    return Boom.notFound()
  }

  return {
    ok: true,
    data: {
      id: params.refreshTokenId,
      revoked: payload.revoked,
    },
  }
}
module.exports = {
  listPeople,
  listPeopleForSelectList,
  listRefreshTokens,
  availableContacts,
  assignContact,
  unAssignContact,
  showPerson,
  updatePerson,
  createPerson,
  updatePersonUserPreferences,
  updateRefreshToken,
}
