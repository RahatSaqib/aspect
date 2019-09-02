const Promise = require('bluebird')
const bcrypt = require('bcrypt')

const config = require('../../src/config')
module.exports = require('../utils').seed(seed, __filename)

const now = new Date()
const saltRounds = parseInt(config.passwordSaltRounds, 10)
const userNames = ['reporter-viewer', 'reporter-not-viewer']
const jobFunctionNames = {
  ResultViewerYes: 'Result Viewer - Yes',
  ResultViewerNo: 'Result Viewer - No',
  Clinician: 'Clinician',
}
const countryAbbr3 = 'USA'
const partnerId = 1

async function seed(knex) {
  // ---------------------
  // get admin user id
  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  // ---------------------
  // get country props
  const { id: countryId, culture, timezone } = await knex('Country as c')
    .where({ 'c.a3': countryAbbr3 })
    .select('c.id', 'c.culture', 'c.timezone')
    .first()
  // ---------------------
  // get geographyId with most of results
  const { geographyId } = await knex('Result as r')
    .innerJoin('Geography as g', 'r.geographyId', 'g.id')
    .where({ partnerId, countryId })
    .select('r.geographyId')
    .count('r.id as total')
    .groupBy('r.geographyId')
    .orderBy('total', 'desc')
    .first()
  // ---------------------
  // get user props, create if user is missing
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
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        timezone,
        culture,
        canLogin: true,
        ...auditFields,
      })
    }
  })
  // ---------------------
  const users = await knex('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .whereIn('u.name', userNames)
    .where('p.lastPartnerId', partnerId)
    .select('u.id as userId', 'u.name as userName', 'p.id as personId')
  // ---------------------
  const jfNames = [
    jobFunctionNames.ResultViewerYes,
    jobFunctionNames.ResultViewerNo,
  ]
  await Promise.each(jfNames, async jobFunctionName => {
    const [jobFunctionId] = await knex('JobFunction').insert({
      name: jobFunctionName,
      partnerId,
    })
    // --------
    const jobFunctions = await knex('JobFunction')
      .where({ partnerId })
      .select()
      .reduce((jobFunctionMap, jobFunction) => {
        jobFunctionMap[jobFunction.name] = jobFunction.id
        return jobFunctionMap
      }, {})
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
      // .whereIn('module', ['result', 'reporter'])
      // .whereIn('activity', ['edit', 'view'])
      .select()
      .reduce((permMap, perm) => {
        permMap[`${perm.module}:${perm.activity}`] = perm.id
        return permMap
      }, {})

    // --------
    // helper functions
    // - add job function permission if missing
    const addPermission = async (jobFunctionId, permissionId) => {
      const props = { jobFunctionId, permissionId }
      const perm = await knex('JobFunctionPermission')
        .where(props)
        .first()
      if (!perm) {
        await knex('JobFunctionPermission').insert(props)
      }
    }
    // - delete job function permission if exists
    const delPermission = async (jobFunctionId, permissionId) => {
      const props = { jobFunctionId, permissionId }
      const perm = await knex('JobFunctionPermission')
        .where(props)
        .first()
      if (perm) {
        await knex('JobFunctionPermission').del(props)
      }
    }
    // --------
    // make sure Job Function ResultViewerYes has permission 'result:view'
    if (jobFunctionName === jobFunctionNames.ResultViewerYes) {
      await addPermission(jobFunctionId, permissions['result:view'])
    }
    // make sure Job Function ResultViewerNo does NOT have permission 'result:view'
    else if (jobFunctionName === jobFunctionNames.ResultViewerNo) {
      await delPermission(jobFunctionId, permissions['result:view'])
    }
    // add base permissions
    await Promise.each(
      ['browse:view', 'reporter:view', 'site:view', 'assay:view'],
      perm => addPermission(jobFunctionId, permissions[perm])
    )

    // --------
    // Job
    const userName =
      jobFunctionName === jobFunctionNames.ResultViewerYes
        ? userNames[0]
        : userNames[1]
    const [jobId] = await knex('Job').insert({
      // personId: users.find(x => x.name === userNames[0]).personId,
      personId: users.find(x => x.userName === userName).personId,
      jobFunctionId,
    })
    // --------
    // Job Context
    await knex('JobContext').insert({ jobId, geographyId })
  })
}
