const _ = require('lodash')
const Boom = require('boom')
const isBoom = require('boom/isBoom')
const { query, knex, transact } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')

const MODE_INSERT = 'MODE_INSERT'
const MODE_DELETE = 'MODE_DELETE'

async function getJobFunctionsForSelectList(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const partnersAndJobFunctions = await query(
    'Get partners and job functions for select lists'
  )
    .from('JobFunction as jf')
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .orderBy(['p.name', 'jf.name'], 'asc')
    .select(
      'p.id as partnerId',
      'p.name as partnerName',
      'jf.id as jobFunctionId',
      'jf.name as jobFunctionName'
    )

  const partners = _.map(
    _.uniqBy(partnersAndJobFunctions, 'partnerId'),
    partnerRecord => ({
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
          })
        ),
        'name'
      ),
    })
  )

  return {
    ok: true,
    data: partners,
  }
}

// ----------------------------------------------------------------------------------------
async function getJobFunction(jobFunctionId, partnerId, err) {
  const jobFunction = await knex('JobFunction')
    .where({ id: jobFunctionId })
    .first('partnerId')
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
  const { payload: { personId, jobFunctionId } } = request
  const { auth } = request
  const { partnerId } = await getUser(auth.credentials.name)

  // should be same 'partnerId' in requested jobFunction and current user
  const err = 'Only Admin with same partnerId as JobFunction can manage Jobs'
  const jf = await getJobFunction(jobFunctionId, partnerId, err)
  if (isBoom(jf)) {
    return jf
  }

  const job = await knex('Job')
    .where({ personId, jobFunctionId })
    .first()

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
        await knex('JobContext')
          .where({ jobId: job.id })
          .del()
        // remove Job
        await knex('Job')
          .where({ id: job.id })
          .del()
      })
    }
  }

  // return all jobs for requested person
  const jobs = await knex('Job')
    .where({ personId })
    .select('id', 'personId', 'jobFunctionId')
  return { ok: true, data: jobs }
}
// ----------------------------------------------------------------------------------------
const assignJobContext = async request => manageJobContext(request, MODE_INSERT)
const unassignJobContext = async request =>
  manageJobContext(request, MODE_DELETE)
async function manageJobContext(request, mode) {
  const { payload } = request
  const { personId, jobFunctionId, geographyId, siteId } = payload
  // validate
  const bothMissing = !geographyId && !siteId
  const bothPresent = !!geographyId && !!siteId
  if (bothMissing || bothPresent) {
    return Boom.conflict(
      'Either geographyId or siteId (not both) is needed to manage JobContext'
    )
  }
  const jobResponse = await assignJob(request)
  if (isBoom(jobResponse)) {
    return jobResponse
  }
  // get jobId for requested 'personId' and 'jobFunctionId'
  // (notice that array jobResponse.data must have such item after 'assignJob()')
  const { id: jobId } = jobResponse.data.find(
    x => x.personId === personId && x.jobFunctionId === jobFunctionId
  )
  const whereProps = { jobId, geographyId, siteId }
  if (mode === MODE_DELETE) {
    // remove JobContext
    await knex('JobContext')
      .where(whereProps)
      .del()
    // remove Job if requested
    const { removeJob } = payload
    if (removeJob) {
      await unassignJob(request)
    }
  } else if (mode === MODE_INSERT) {
    // create JobContext entry if missing
    const jobContext = await knex('JobContext')
      .where(whereProps)
      .first()
    if (!jobContext) {
      await knex('JobContext').insert(whereProps)
    }
  }
  // return all jobContexts for requested person
  const jobContexts = await knex('JobContext as jc')
    .join('Job as j', 'jc.jobId', 'j.id')
    .where('j.personId', personId)
    .select(
      'jc.jobId',
      'jc.geographyId',
      'jc.siteId',
      'j.personId',
      'j.jobFunctionId'
    )
  return { ok: true, data: jobContexts }
}
// ----------------------------------------------------------------------------------------
// helper function for JobFunctionDashboardWidget, JobFunctionFeature, JobFunctionPermission
// ----------------------------------------------------------------------------------------
async function manageJobFunctionBaseItems(request, tableName, mode, err) {
  const { auth, payload } = request
  const { jobFunctionId } = payload
  const { partnerId } = await getUser(auth.credentials.name)

  // should be same 'partnerId' in requested jobFunction and current user
  const jf = await getJobFunction(jobFunctionId, partnerId, err)
  if (isBoom(jf)) {
    return jf
  }

  let fieldName
  let itemsPropName
  switch (tableName) {
    case 'JobFunctionDashboardWidget':
      fieldName = 'widgetId'
      itemsPropName = 'widgets' // in request payload
      break
    case 'JobFunctionFeature':
      fieldName = 'featureId'
      itemsPropName = 'features' // in request payload
      break
    case 'JobFunctionPermission':
      fieldName = 'permissionId'
      itemsPropName = 'permissions' // in request payload
      break
    default:
      return Boom.badData(`Incorrect table name = ${tableName}`)
  }

  const items = payload[itemsPropName]

  if (mode === MODE_DELETE) {
    const { all } = payload
    // proceed if requested removing ALL items or array 'items' is defined
    if (all || !_.isEmpty(items)) {
      await knex(tableName)
        .where({ jobFunctionId })
        .where(function() {
          if (!all) {
            this.whereIn(fieldName, items)
          }
        })
        .del()
    }
  } else if (mode === MODE_INSERT) {
    const existingIds = await knex(tableName)
      .where({ jobFunctionId })
      .select(fieldName)
    //
    const toInsertIds = items.filter(x => !existingIds.includes(x))
    const toDeleteIds = existingIds.filter(x => !items.includes(x))
    //
    if (toDeleteIds.length > 0) {
      await knex(tableName)
        .where({ jobFunctionId })
        .whereIn(fieldName, toDeleteIds)
        .del()
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
  const data = await knex(tableName)
    .where({ jobFunctionId })
    .select('jobFunctionId', fieldName)
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
async function assignJobFunctionFeatures(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionFeature',
    MODE_INSERT,
    'Only Admin with same partnerId as JobFunction can assign user to features'
  )
}
async function unassignJobFunctionFeatures(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionFeature',
    MODE_DELETE,
    'Only Admin with same partnerId as JobFunction can remove user from features'
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

module.exports = {
  getJobFunctionsForSelectList,
  //
  assignJob,
  unassignJob,
  assignJobContext,
  unassignJobContext,
  assignJobFunctionDashboardWidgets,
  unassignJobFunctionDashboardWidgets,
  assignJobFunctionFeatures,
  unassignJobFunctionFeatures,
  assignJobFunctionPermissions,
  unassignJobFunctionPermissions,
}
