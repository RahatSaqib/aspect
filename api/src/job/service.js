const _ = require('lodash')
const Boom = require('@hapi/boom')
const { query, knex, transact } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { getUserFromCredentials } = require('../auth/constraints')
const { getAssignmentsForUser } = require('../shared/constraints')

const MODE_INSERT = 'MODE_INSERT'
const MODE_DELETE = 'MODE_DELETE'

async function getJobFunctionsForSelectList(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const partnersAndJobFunctions = await query('Get partners and job functions for select lists')
    .from('JobFunction as jf')
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .orderBy(['p.name', 'jf.name'], 'asc')
    .select(
      'p.id as partnerId',
      'p.name as partnerName',
      'jf.id as jobFunctionId',
      'jf.name as jobFunctionName',
      'jf.externalId as jobFunctionExternalId'
    )

  const partners = _.map(_.uniqBy(partnersAndJobFunctions, 'partnerId'), partnerRecord => ({
    id: partnerRecord.partnerId,
    name: partnerRecord.partnerName,
    jobFunctions: _.orderBy(
      _.map(
        _.filter(partnersAndJobFunctions, {
          partnerId: partnerRecord.partnerId,
        }),
        jobFunctionRecord => ({
          id: jobFunctionRecord.jobFunctionId,
          name: jobFunctionRecord.jobFunctionName,
          externalId: jobFunctionRecord.jobFunctionExternalId,
        })
      ),
      'name'
    ),
  }))

  return {
    ok: true,
    data: partners,
  }
}

// ----------------------------------------------------------------------------------------
// permissions for specified 'person' for this 'partner'
async function getPermissions(request) {
  const {
    params: { personId, partnerId },
  } = request
  const { auth } = request
  const user = await getUser(auth.credentials.name)
  if (user.partnerId !== +partnerId) {
    return Boom.expectationFailed('partnerId does not match user.partnerId')
  }
  //
  const data = await query('Get permissions for person and partner')
    .from('Permission as p')
    .innerJoin('JobFunctionPermission as jfp', 'p.id', 'jfp.permissionId')
    .innerJoin('JobFunction as jf', 'jfp.jobFunctionId', 'jf.id')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where('jf.partnerId', partnerId)
    .where('ps.id', personId)
    .orderBy(['p.module', 'p.activity'])
    .distinct('p.module', 'p.activity')
    .then(items => items.map(p => `${p.module}:${p.activity}`))
  //
  return { ok: true, data }
}

// ----------------------------------------------------------------------------------------
async function getJobFunction(jobFunctionId, partnerId, err) {
  const jobFunction = await knex('JobFunction').where({ id: jobFunctionId }).first('partnerId')
  if (!jobFunction) {
    return Boom.notFound('Requested JobFunction is missing')
  }
  // should be same 'partnerId' in requested jobFunction and current user
  if (jobFunction.partnerId !== partnerId) {
    return Boom.conflict(err)
  }
  return jobFunction
}
// ----------------------------------------------------------------------------------------
const assignJob = async request => manageJob(request, MODE_INSERT)
const unassignJob = async request => manageJob(request, MODE_DELETE)
async function manageJob(request, mode) {
  const {
    payload: { personId, jobFunctionId },
  } = request
  const { auth } = request

  const valResult = await validateJobData({ personId, jobFunctionId, auth })
  if (valResult.isBoom) {
    return valResult
  }

  const job = await knex('Job').where({ personId, jobFunctionId }).first()

  if (mode === MODE_INSERT) {
    // create job if missing
    if (!job) {
      await knex('Job').insert({
        personId,
        jobFunctionId,
      })
    }
  } else if (mode === MODE_DELETE) {
    if (job) {
      await transact(async knex => {
        // remove all FK's entries
        await knex('JobContext').where({ jobId: job.id }).del()
        // remove Job
        await knex('Job').where({ id: job.id }).del()
      })
    }
  }

  // return all jobs for requested person
  const jobs = await knex('Job').where({ personId }).select('id', 'personId', 'jobFunctionId')
  return { ok: true, data: jobs }
}
// ----------------------------------------------------------------------------------------
const assignJobContext = async request => manageJobContext(request, MODE_INSERT)
const unassignJobContext = async request => manageJobContext(request, MODE_DELETE)
const validateAndNormalizeJobContextData = async request => {
  const { payload } = request
  const { auth } = request
  const { partnerId } = await getUser(auth.credentials.name)
  const { personId, jobFunctionId, geographyId, siteId } = payload
  let { jobId } = payload

  // either jobId or both (personId and jobFunctionId) are needed
  const hasPersonAndJobFunction = !!personId && !!jobFunctionId
  if (!jobId && !hasPersonAndJobFunction) {
    return Boom.expectationFailed('Either jobId or (personId and jobFunctionId) is needed to manage JobContext')
  }
  // either geographyId or siteId is needed
  const bothMissing = !geographyId && !siteId
  const bothPresent = !!geographyId && !!siteId
  if (bothMissing || bothPresent) {
    return Boom.conflict('Either geographyId or siteId (not both) is needed to manage JobContext')
  }
  // existing siteId
  if (siteId) {
    const item = await knex('Site').where({ id: siteId }).first()
    if (!item) {
      return Boom.badData(`Missing site with specified siteId=${siteId}`)
    }
  }
  // existing geographyId
  if (geographyId) {
    const item = await knex('Geography').where({ id: geographyId }).first()
    if (!item) {
      return Boom.badData(`Missing geography with specified geographyId=${geographyId}`)
    }
  }
  if (jobId) {
    const item = await knex('Job as j')
      .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
      .where('j.id', jobId)
      .first('j.id', 'jf.partnerId')
    if (!item) {
      return Boom.badData(`Missing job with specified jobId=${jobId}`)
    }
    if (item.partnerId !== partnerId) {
      return Boom.expectationFailed('Only Admin with same partnerId as Job/JobFunction can manage Jobs')
    }
  } else if (!jobId) {
    // if no jobId - create Job with personId/jobFunctionId

    // use 'personId, jobFunctionId' from request to create/get Job
    const jobResponse = await assignJob(request)
    if (jobResponse.isBoom) {
      // Boom when current Admin user and JobFunction have different partnerId's
      return jobResponse
    }
    // get jobId for requested personId/jobFunctionId from list of all Jobs for personId
    ;[{ id: jobId }] = jobResponse.data.filter(x => x.personId === personId && x.jobFunctionId === jobFunctionId)
  } else {
    const item = await knex('Job').where({ id: jobId }).first()
    if (!item) {
      return Boom.badData(`Missing job with specified jobId=${jobId}`)
    }
  }
  return { jobId }
}
async function manageJobContext(request, mode) {
  const { payload } = request
  const { geographyId, siteId } = payload
  const normalizedData = await validateAndNormalizeJobContextData(request)
  if (normalizedData.isBoom) {
    return normalizedData
  }
  const { jobId } = normalizedData

  const q = knex('JobContext')
    .where({ jobId })
    .where(function () {
      if (geographyId) {
        this.where({ geographyId })
      } else if (siteId) {
        this.where({ siteId })
      }
    })
  if (mode === MODE_DELETE) {
    // remove JobContext
    await q.clone().del()
    // remove Job if requested
    const { removeJob } = payload
    if (removeJob) {
      await unassignJob(request)
    }
  } else if (mode === MODE_INSERT) {
    // create JobContext entry if missing
    const jobContext = await q.clone().first()
    if (!jobContext) {
      await knex('JobContext').insert({ jobId, geographyId, siteId })
    }
  }
  // return all jobContexts for requested person
  const jobContexts = await knex('JobContext as jc')
    .join('Job as j', 'jc.jobId', 'j.id')
    .where('jc.jobId', jobId)
    .select('jc.jobId', 'jc.geographyId', 'jc.siteId', 'j.personId', 'j.jobFunctionId')
  return { ok: true, data: jobContexts }
}

// ----------------------------------------------------------------------------------------
// helper function for JobFunctionDashboardWidget, JobFunctionPermission
// ----------------------------------------------------------------------------------------
async function manageJobFunctionBaseItems(request, tableName, mode, err) {
  const { auth, payload } = request
  const { jobFunctionId } = payload
  const { partnerId } = await getUser(auth.credentials.name)

  // should be same 'partnerId' in requested jobFunction and current user
  const jf = await getJobFunction(jobFunctionId, partnerId, err)
  if (jf.isBoom) {
    return jf
  }

  let fieldName
  let itemsPropName
  switch (tableName) {
    case 'JobFunctionDashboardWidget':
      fieldName = 'widgetId' // foreign key to table DashboardWidget
      itemsPropName = 'widgets' // in request payload
      break
    case 'JobFunctionPermission':
      fieldName = 'permissionId'
      itemsPropName = 'permissions' // in request payload
      break
    default:
      return Boom.badData(`Incorrect tableName "${tableName}"`)
  }

  const items = payload[itemsPropName]

  if (mode === MODE_DELETE) {
    const { all } = payload
    // proceed if requested removing ALL items or array 'items' is defined
    if (all || !_.isEmpty(items)) {
      await knex(tableName)
        .where({ jobFunctionId })
        .where(function () {
          if (!all) {
            this.whereIn(fieldName, items)
          }
        })
        .del()
    }
  } else if (mode === MODE_INSERT) {
    const existingIds = await knex(tableName).where({ jobFunctionId }).select(fieldName)
    //
    const toInsertIds = items.filter(x => !existingIds.includes(x))
    const toDeleteIds = existingIds.filter(x => !items.includes(x))
    //
    if (toDeleteIds.length > 0) {
      await knex(tableName).where({ jobFunctionId }).whereIn(fieldName, toDeleteIds).del()
    }
    if (toInsertIds.length > 0) {
      await knex(tableName).insert(
        toInsertIds.map(fieldValue => ({
          jobFunctionId,
          [fieldName]: fieldValue,
        }))
      )
    }
  }

  // return all items for specified jobFunctionId
  const data = await knex(tableName).where({ jobFunctionId }).select('jobFunctionId', fieldName)
  return { ok: true, data }
}

// ----------------------------------------------------------------------------------------
async function assignJobFunctionDashboardWidgets(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionDashboardWidget',
    MODE_INSERT,
    'Only Admin with same partnerId as JobFunction may assign user to widget'
  )
}

async function unassignJobFunctionDashboardWidgets(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionDashboardWidget',
    MODE_DELETE,
    'Only Admin with same partnerId as JobFunction may unassign user from widget'
  )
}

// ----------------------------------------------------------------------------------------
async function assignJobFunctionPermissions(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionPermission',
    MODE_INSERT,
    'Only Admin with same partnerId as JobFunction may assign permissions to JobFunction'
  )
}

async function unassignJobFunctionPermissions(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionPermission',
    MODE_DELETE,
    'Only Admin with same partnerId as JobFunction may unassign permissions from JobFunction'
  )
}

// ----------------------------------------------------------------------------------------
async function assignPersonTo(request) {
  const { payload } = request
  // ----------------
  // jobId
  // ----------------
  const { personId, jobFunctionId } = payload
  const { auth } = request
  const creator = await validateJobData({ personId, jobFunctionId, auth })
  if (creator.isBoom) {
    return creator
  }
  let jobId
  const jobProps = { personId, jobFunctionId }
  const job = await knex('Job').where(jobProps).first()
  if (!job) {
    ;[jobId] = await knex('Job').insert(jobProps)
  } else {
    jobId = job.id
  }
  // ----------------
  // siteId or geographyId
  // ----------------

  // This will used as default value for geography of assigment
  const creatorGeography = await knex('Job as j')
    .where({ personId: creator.personId })
    .leftJoin('JobContext as jc', 'j.id', 'jc.jobId')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .select('g.stateId', 'g.countryId', 'g.lgaId')
    .first()

  const {
    countryId,
    stateId = creatorGeography?.stateId ?? null,
    lgaId = creatorGeography?.lgaId ?? null,
    siteId = null,
    diseaseId = null,
    assayTypeId = null,
    assayId = null,
    deviceTypeId: deviceTypeExternalId = null,
  } = payload
  let geographyId
  if (!siteId && (countryId || stateId || lgaId)) {
    // ----------------
    // geographyId
    // ----------------
    const geographyProps = { countryId, stateId, lgaId }
    const geography = await knex('Geography').where(geographyProps).first('id')
    if (!geography) {
      ;[geographyId] = await knex('Geography').insert(geographyProps)
    } else {
      geographyId = geography.id
    }
  }

  let deviceTypeId
  if (deviceTypeExternalId) {
    ;[deviceTypeId] = (await knex('DeviceType').where('externalId', deviceTypeExternalId).pluck('id')) || []
  }

  // ----------------
  // JobContext
  // ----------------
  // create JobContext entry if missing
  if (siteId || geographyId) {
    const { id: jobContextId } =
      (await knex('JobContext')
        .where({ jobId })
        .andWhere(function () {
          if (siteId) {
            this.where({ siteId })
          } else if (geographyId) {
            this.where({ geographyId })
          }
        })
        .andWhere(function () {
          if (assayId) {
            this.where({ assayId })
          }
          if (deviceTypeId) {
            this.where({ deviceTypeId })
          }
          if (assayTypeId) {
            this.where({ assayTypeId })
          }
          if (diseaseId) {
            this.where({ diseaseId })
          }
        })
        .first('id')) || {}
    if (!jobContextId) {
      await knex('JobContext').insert({
        jobId,
        geographyId,
        siteId,
        diseaseId,
        deviceTypeId,
        assayTypeId,
        assayId,
      })
    }
  }
  // ----------------
  // return list of person assignments for showing in right side of Person Job Assignment tab
  // ----------------
  const personAssignments = await getAssignments({ auth, personId })
  return { ok: true, data: personAssignments }
}

// ----------------------------------------------------------------------------------------
async function getPersonAssignments(request) {
  const {
    auth,
    params: { personId },
  } = request
  const personAssignments = await getAssignments({ auth, personId })
  return { ok: true, data: personAssignments }
}

// ----------------------------------------------------------------------------------------
async function getAssignments({ auth, personId }) {
  const user = await getUserFromCredentials(auth.credentials)
  return getAssignmentsForUser(user, personId)
}

// ----------------------------------------------------------------------------------------
async function validateJobData({ personId, jobFunctionId, auth }) {
  const creator = await getUser(auth.credentials.name)

  // should be same 'partnerId' in requested jobFunction and current user
  const err = 'Only Admin with same partnerId as JobFunction can manage Jobs'
  const jf = await getJobFunction(jobFunctionId, creator.partnerId, err)
  if (jf.isBoom) {
    return jf
  }

  const person = await knex('Person as p')
    .leftOuterJoin('Geography as g', 'p.geographyId', 'g.id')
    .where('p.id', personId)
    .first('g.countryId')
  if (!person) {
    return Boom.badData(`Can not find person with id=${personId}`)
  }
  if (!person.countryId) {
    return Boom.badData('Requested person does not have countryId')
  }
  if (person.countryId !== creator.countryId) {
    return Boom.badData(
      `Different countryIds in current Admin user (${creator.countryId}) and requested person ${person.countryId}`
    )
  }

  return creator
}

// ----------------------------------------------------------------------------------------
async function removePersonAssignment(request) {
  const {
    auth,
    params: { personId, jobContextId },
  } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const jobContext = await knex('JobContext as jc')
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    // constraints to make sure current user can access this data
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .where('jc.id', jobContextId)
    .first('j.personId', 'jc.jobId', 'j.jobFunctionId')
  // validate
  if (!jobContext) {
    return Boom.badData('Incorrect jobContextId specified')
  }
  if (personId !== jobContext.personId) {
    return Boom.badData('Specified personId does not match job personId')
  }
  // check 'person' constraints
  const { jobFunctionId } = jobContext
  const validator = await validateJobData({ personId, jobFunctionId, auth })
  if (validator.isBoom) {
    return validator
  }

  // remove JobContext
  await knex('JobContext').where('id', jobContextId).del()

  // remove also Job entry if no other JobContexts use it
  const { count } = await knex('JobContext').where('jobId', jobContext.jobId).count('id as count').first()
  if (count === 0) {
    await knex('Job').where('id', jobContext.jobId).del()
  }
  // ----------------
  // return list of remaining person assignments
  // ----------------
  const personAssignments = await getAssignments({ auth, personId })
  return { ok: true, data: personAssignments }
}

// ----------------------------------------------------------------------------------------

module.exports = {
  getJobFunctionsForSelectList,
  getPermissions,
  //
  assignJob,
  unassignJob,
  assignJobContext,
  unassignJobContext,
  assignJobFunctionDashboardWidgets,
  unassignJobFunctionDashboardWidgets,

  assignJobFunctionPermissions,
  unassignJobFunctionPermissions,
  assignPersonTo,
  getPersonAssignments,
  removePersonAssignment,
}
