const Boom = require('@hapi/boom')
const _ = require('lodash')
const { getPeopleBase, hasCountryLevelPermission } = require('../../shared/utilsPerson')
const { query, knex, filterParams, sortPageParams } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const { revokeUsersToken, lockedOutUser } = require('../../auth/common/db')
const { transformGeographyFromUpdates } = require('../../geography/service')
const { updateTagsById } = require('../../tag/service')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

const getCreateAssignPerson = async (
  knex,
  { countryId, partnerId, geographyId, siteId, name, email, cell, timezone, culture, jobFunctionExternalId }
) => {
  const personQuery = getPeopleBase()
    .where('g.countryId', countryId)
    .groupBy('p.id')
    .first('p.name', 'p.id', 'p.email', 'p.email2', 'p.cell', 'jc.id as jobContextId')

  const personByName = await personQuery.where('p.name', name)
  const personByEmail = await personQuery.where(builder => {
    builder.where('p.email', email).orWhere('p.email2', email)
  })

  let personId
  // ----------
  // person-by-name found
  // ----------
  if (personByName) {
    personId = personByName.id
    // update email if it's missing
    if (email && !personByName.email) {
      await knex('Person').update('email', email).where('id', personId)
    }
    // update cell if it's missing
    if (cell && !personByName.cell) {
      await knex('Person').update('cell', cell).where('id', personId)
    }
  }
  // ----------
  // or person-by-email found
  // ----------
  else if (personByEmail) {
    personId = personByEmail.id
    // update cell if it's missing
    if (cell && !personByEmail.cell) {
      await knex('Person').update('cell', cell).where('id', personId)
    }
  }
  // ----------
  // or create person with specified name
  // ----------
  else if (name) {
    /* validates if the tz is included in our db */
    const { timeZone: defaultTimeZone } =
      (await knex('Geography as g')
        .join('Country as c', 'c.id', 'g.countryId')
        .where('g.id', geographyId)
        .first('c.timezone as timeZone')) || (await knex('Country as c').first('c.timezone as timeZone'))
    const { existingTimeZone } = (await knex('TimeZone').where('id', timezone).first('id as existingTimeZone')) || {}
    timezone = existingTimeZone || defaultTimeZone
    ;[personId] = await knex('Person').insert({
      geographyId,
      name: name || null,
      email: email || null,
      cell: cell || null,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      timezone,
      culture,
      createdOn: new Date(),
      updatedOn: new Date(),
      partnerId,
    })
  }

  /**
   * for this person -
   * - check/create job for 'Lab User' or 'Technician'
   * - assign this person to site, i.e. to JobContext
   */
  if (personId) {
    // assign contact to site if it is not assigned yet
    const jobFunction = await knex('JobFunction').where({ externalId: jobFunctionExternalId }).first('id')
    if (!jobFunction) {
      throw Boom.expectationFailed(`Required job function '${jobFunctionExternalId}' is missing`)
    }

    const newJobContext = { personId, jobFunctionId: jobFunction.id, siteId }
    const existingJobContext = await knex('JobContext')
      .where(newJobContext)
      .whereNull('assayTypeId')
      .whereNull('assayId')
      .whereNull('deviceTypeId')
      .whereNull('diseaseId')
      .first()
    if (!existingJobContext) {
      await knex('JobContext').insert(newJobContext)
    }
  }

  return personId
}

async function listPeople(request) {
  const { auth, query } = request
  const { personTimezoneIANA } = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)

  const countryLevelPermission = await hasCountryLevelPermission(dataConstraints, ['person:edit', 'person:admin'])

  const { geographicLevel, tags } = query

  const personQuery = getPeopleBase()
    .leftJoin('Geography as jcg', qb =>
      qb.on('jc.geographyId', 'jcg.id').orOn('s.geographyId', 'jcg.id').orOn('p.geographyId', 'jcg.id')
    )
    .leftJoin('PersonTag as pt', 'p.id', 'pt.personId')
    .leftJoin('Tag as t', 'pt.tagId', 't.id')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      contactNameOrEmail: ['p.name', 'p.email', 'p.email2'],
      siteId: 'jc.siteId',
      contactStatus: 'p.disabled',
    })
    .modify(qb => {
      if (!countryLevelPermission) addConstraints(qb, dataConstraints, { geography: 'jcg', site: 's' })
    })
    .where(qb => {
      if (dataConstraints.partner.id) {
        qb.whereNull('p.partnerId').orWhere('p.partnerId', dataConstraints.partner.id)
      }
    })
    .where(qb => {
      if (query?.onlyUsersNotDisabled) {
        qb.where('p.disabled', 0)
      }
    })

  switch (geographicLevel) {
    case 'state':
      personQuery.andWhere(qb => qb.whereNotNull('jcg.stateId').whereNull('jcg.lgaId'))
      break
    case 'lga':
      personQuery.andWhere(qb => qb.whereNotNull('jcg.lgaId').whereNull('jc.siteId'))
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
  const getCount = personQuery.clone().select(knex.raw('count(distinct p.id) as total')).first()

  const assignmentsSubquery = knex
    .select(
      knex.raw(`
        group_concat(
          case 
            when job_count = 1 then job_name
            else concat(job_name, ' (', job_count, ')')
          end
          separator '; '
        )
      `)
    )
    .from(function () {
      this.select('jf.name as job_name', knex.raw('count(*) as job_count'))
        .from('JobContext as jc')
        .innerJoin('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
        .whereRaw('jc.personId = p.id')
        .groupBy('jf.name')
        .as('job_counts')
    })
    .as('assignments')

  const tagsSubquery = knex('Tag as t')
    .innerJoin('PersonTag as pt', 't.id', 'pt.tagId')
    .innerJoin('Partner as prt', 't.partnerId', 'prt.id')
    .where('pt.personId', '=', knex.raw('p.id'))
    .modify(addConstraints, dataConstraints, { partner: 'prt' })
    .select(knex.raw(`group_concat(t.title separator ';')`))
    .as('tags')

  // get rows
  const contactsQuery = personQuery
    .clone()
    .leftJoin('User as u', 'p.userId', 'u.id')
    .modify(sortPageParams, query, 'p.name')
    .groupBy('p.id')
    .select(
      'p.id',
      'p.name',
      'p.disabled',
      'p.disabledOn',
      assignmentsSubquery,
      'st.name as state',
      'l.name as lga',
      's.name as site',
      tagsSubquery,
      'p.email',
      'p.phone',
      'p.cell',
      getDateTimeProjectionInTimeZoneIANA(knex, 'u.lastLogin', personTimezoneIANA, 'lastLogin')
    )

  // return result when both queries are finished
  const [{ total }, data] = await Promise.all([getCount, contactsQuery])

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

function siteContacts(id) {
  return knex('JobContext as jc')
    .innerJoin('Person as p', 'jc.personId', 'p.id')
    .where('jc.siteId', id)
    .select('p.name', 'p.id')
}

async function getPersonDetails(personId, dataConstraints) {
  const personDetails = await query('Get person details')
    .from('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftOuterJoin('JobContext as jc', 'p.id', 'jc.personId')
    .leftOuterJoin('Geography as jg', 'jc.geographyId', 'jg.id')
    .leftJoin('User as u', 'p.userId', 'u.id')
    .leftOuterJoin('State as s', 'g.stateId', 's.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where(q =>
      q
        .modify(addConstraints, dataConstraints, { geography: 'jg' })
        .orWhereRaw('jc.id IS NULL')
        .orWhereRaw('jg.id IS NULL')
    )
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
      'p.phoneE164',
      'p.cell',
      'p.cellE164',
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
      'p.disabled',
      'p.disabledOn',
      'jc.id as jobContextId'
    )

  if (personDetails) {
    const tags = await query('Get person tags')
      .from('Person as p')
      .join('PersonTag as pt', 'pt.personId', 'p.id')
      .join('Tag as t', 'pt.tagId', 't.id')
      .where({ 'p.id': personId })
      .select('t.title')

    personDetails.tags = tags.map(t => t.title)
  }
  return personDetails
}

async function validateContact(request) {
  const {
    params: { siteId },
    payload: { id },
    auth,
  } = request
  const dataConstraints = await getConstraints(auth.credentials)

  // Get site to add contact to
  const site = await knex('Site as s')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { geography: 'g', site: 's' })
    .where('s.id', '=', siteId)

  const personDetails = await getPersonDetails(id, dataConstraints)

  return {
    siteId,
    site,
    personDetails,
  }
}

async function savePerson(request, updatablePersonFields) {
  const { params, payload, auth } = request

  _.mapKeys(payload, (value, key) => {
    if (key !== 'tags') {
      if (value === '') {
        _.set(payload, `${key}`, null)
      }
    }
  })

  // TODO: check access level permissions
  const currentlyLoggedInUser = await getUser(request.auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  const personDetails = await getPersonDetails(params.personId, dataConstraints)
  if (_.isEmpty(personDetails)) {
    return Boom.notFound()
  }

  const changedFields = _.reduce(
    payload,
    (result, value, key) => {
      if (
        _.includes(
          updatablePersonFields.filter(f => f !== 'tags'),
          key
        ) &&
        key in personDetails &&
        personDetails[key] !== value
      ) {
        result[key] = value
      }
      return result
    },
    {}
  )

  let changedPersonFields = changedFields

  const thereAreModifiedGeographyFields = ['countryId', 'stateId', 'lgaId'].some(f =>
    Object.keys(changedFields).includes(f)
  )

  if (thereAreModifiedGeographyFields) {
    changedPersonFields = await transformGeographyFromUpdates(changedFields, dataConstraints.country.id)
  }

  await updateTagsById(params.personId, 'person', payload.tags, auth)

  if (!_.isEmpty(changedPersonFields)) {
    if (changedFields.countryId && personDetails.lastCountryId !== changedFields.countryId) {
      changedPersonFields.lastCountryId = changedFields.countryId
    }

    changedPersonFields.updatedOn = new Date()
    changedPersonFields.updatedBy = currentlyLoggedInUser.id

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

async function showPerson(request) {
  const { params, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const personDetails = await getPersonDetails(params.personId, dataConstraints)
  if (_.isEmpty(personDetails)) {
    return Boom.notFound()
  }

  if (personDetails.userId == null) {
    personDetails.jobFunctions = []
  } else {
    const jobFunctionsForUser = await query('Get job functions for user')
      .from('JobContext as jc')
      .innerJoin('JobFunction as jf', 'jf.id', 'jc.jobFunctionId')
      .innerJoin('Person as ps', 'ps.id', 'jc.personId')
      .where({ 'ps.userId': personDetails.userId })
      .select('ps.userId', 'jc.jobFunctionId', 'jf.partnerId')
    personDetails.jobFunctions = _.map(jobFunctionsForUser, 'jobFunctionId')
    if (jobFunctionsForUser.length > 0) {
      personDetails.partnerId = jobFunctionsForUser[0].partnerId
    }
  }

  return { ok: true, data: personDetails }
}

module.exports = {
  getCreateAssignPerson,
  listPeople,
  siteContacts,
  getPersonDetails,
  validateContact,
  savePerson,
  showPerson,
}
