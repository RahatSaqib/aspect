const Promise = require('bluebird')
const bcrypt = require('bcrypt')
const { upsertJobFunction } = require('../common')
const config = require('../../src/config')
module.exports = require('../utils').seed(seed, __filename)

const now = new Date()
const saltRounds = parseInt(config.passwordSaltRounds, 10)
const userNames = ['result-viewer', 'result-not-viewer']
const jobFunctionNames = {
  ResultViewerYes: 'Result Viewer - Yes',
  ResultViewerNo: 'Result Viewer - No',
  Clinician: 'Clinician',
}

async function seed(knex) {
  // ---------------------
  // get admin user id, and it's last countryId and partnerId
  const {
    id: adminId,
    lastCountryId: countryId,
    lastPartnerId: partnerId,
  } = await knex('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where('u.name', 'admin')
    .first('u.id', 'p.lastCountryId', 'p.lastPartnerId')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  // ---------------------
  // few country props
  const { culture, timezone } = await knex('Country')
    .where({ id: countryId })
    .select('culture', 'timezone')
    .first()
  // ---------------------
  // get siteId with most of results
  const { siteId, geographyId } =
    (await knex('Result as r')
      .innerJoin('Site as s', 'r.siteId', 's.id')
      .innerJoin('Geography as g', 's.geographyId', 'g.id')
      .innerJoin('Sample as sa', 'r.sampleId', 'sa.id')
      .where('r.partnerId', partnerId)
      .where('g.countryId', countryId)
      .whereNotNull('sa.originSiteId')
      .select('sa.originSiteId as siteId', 'r.geographyId')
      .count('r.id as total')
      .groupBy('sa.originSiteId')
      .orderBy('total', 'desc')
      .first()) || {}
  // ---------------------
  // make sure user exists - create if missing
  await Promise.each(userNames, async name => {
    const user = await knex('User')
      .where({ name })
      .first()
    if (!user) {
      // create User
      const [userId] = await knex('User').insert({
        name,
        password: bcrypt.hashSync('test07', saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0,
      })
      // create Person
      await knex('Person').insert({
        userId,
        geographyId,
        name,
        lastPartnerId: partnerId, // same as 'admin' user
        lastCountryId: countryId, // same as 'admin' user
        timezone,
        culture,
        canLogin: true,
        ...auditFields,
      })
    }
  })
  // ---------------------
  // read props for our users
  const users = await knex('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .whereIn('u.name', userNames)
    .where('p.lastPartnerId', partnerId)
    .select('u.id as userId', 'u.name as userName', 'p.id as personId')
  // ---------------------
  // add 2 Job Functions - one has result:view, another - not
  const jfNames = [
    jobFunctionNames.ResultViewerYes,
    jobFunctionNames.ResultViewerNo,
  ]
  await Promise.each(jfNames, async jobFunctionName => {
    const jobFunctionId = await upsertJobFunction(
      knex,
      jobFunctionName,
      partnerId
    )
    // --------
    const jobFunctions = await knex('JobFunction')
      .where({ partnerId })
      .select()
      .then(items =>
        items.reduce((jobFunctionMap, jobFunction) => {
          jobFunctionMap[jobFunction.name] = jobFunction.id
          return jobFunctionMap
        }, {})
      )
    const jobFunctionsClinicianId = jobFunctions[jobFunctionNames.Clinician]
    // --------
    // Job Function Feature - if missing then copy items from jobFunction.name = 'Clinician'
    const jobFunctionFeatures = await knex('JobFunctionFeature as jff')
      .innerJoin('JobFunction as jf', 'jff.jobFunctionId', 'jf.id')
      .where('jf.partnerId', partnerId)
      .select('jff.*')
    if (!jobFunctionFeatures.find(x => x.jobFunctionId === jobFunctionId)) {
      const items = jobFunctionFeatures
        .filter(x => x.jobFunctionId === jobFunctionsClinicianId)
        .map(({ featureId }) => ({
          jobFunctionId,
          featureId,
        }))
      await knex('JobFunctionFeature').insert(items)
    }
    // --------
    const { id: widgetResultsId } = await knex('DashboardWidget')
      .where('title', 'Results')
      .first('id')
    //
    // Job Function Widget - if missing then copy items from jobFunction.name = 'Clinician'
    const jobFunctionWidgets = await knex('JobFunctionDashboardWidget as jfw')
      .innerJoin('JobFunction as jf', 'jfw.jobFunctionId', 'jf.id')
      .where('jf.partnerId', partnerId)
      .select('jfw.*')
    if (!jobFunctionWidgets.find(x => x.jobFunctionId === jobFunctionId)) {
      const items = jobFunctionWidgets
        .filter(
          x =>
            x.jobFunctionId === jobFunctionsClinicianId &&
            x.widgetId !== widgetResultsId
        )
        .map(({ widgetId }) => ({
          jobFunctionId,
          widgetId,
        }))
      await knex('JobFunctionDashboardWidget').insert([
        ...items,
        {
          jobFunctionId,
          widgetId: widgetResultsId,
        },
      ])
    }
    // --------
    // get all permissions
    const permissions = await knex('Permission')
      .select()
      .then(items =>
        items.reduce((permMap, perm) => {
          permMap[`${perm.module}:${perm.activity}`] = perm.id
          return permMap
        }, {})
      )
    // --------
    // make sure Job Function ResultViewerYes has permission 'result:view'
    if (jobFunctionName === jobFunctionNames.ResultViewerYes) {
      await addPermission(knex, jobFunctionId, permissions['result:view'])
    }
    // make sure Job Function ResultViewerNo does NOT have permission 'result:view'
    else if (jobFunctionName === jobFunctionNames.ResultViewerNo) {
      await delPermission(knex, jobFunctionId, permissions['result:view'])
    }
    // add base permissions
    await Promise.each(
      ['browse:view', 'reporter:view', 'site:view', 'assay:view'],
      perm => addPermission(knex, jobFunctionId, permissions[perm])
    )

    // --------
    // Job
    const userName =
      jobFunctionName === jobFunctionNames.ResultViewerYes
        ? userNames[0]
        : userNames[1]
    const [jobId] = await knex('Job').insert({
      personId: users.find(x => x.userName === userName).personId,
      jobFunctionId,
    })
    // --------
    // Job Context
    await knex('JobContext').insert({ jobId, siteId })
  })
}

// ----------------------------------------------------------------------------
// helper functions
// ----------------------------------------------------------------------------
// add job function permission if missing
async function addPermission(knex, jobFunctionId, permissionId) {
  const props = { jobFunctionId, permissionId }
  const perm = await knex('JobFunctionPermission')
    .where(props)
    .first()
  if (!perm) {
    await knex('JobFunctionPermission').insert(props)
  }
}

// delete job function permission if exists
async function delPermission(knex, jobFunctionId, permissionId) {
  const props = { jobFunctionId, permissionId }
  const perm = await knex('JobFunctionPermission')
    .where(props)
    .first()
  if (perm) {
    await knex('JobFunctionPermission').del(props)
  }
}
