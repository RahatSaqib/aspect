module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { upsertJobFunction } = require('../common')
const { rowsAsObject, getPermissionModules, seedIssueEventTriggersForPartner } = require('../utils')

const { assayTypeToId, partnerTypeToId, resultSourceToId } = require('../../src/shared/dictionary')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User').where({ name: 'gates_rdt' }).first('id')
  if (existingAdminUser) {
    return
  }
  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'gates_rdt',
    password: bcrypt.hashSync('gates2018', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [deviceTypes, modules, issueTypes] = await Promise.all([
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    getPermissionModules(knex),
    rowsAsObject(knex, 'IssueType', 'externalId'),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'GatesRDT',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  await knex('Assay').insert({
    name: 'CommCare Gates RDT',
    abbreviation: 'CC RDT',
    i18nKey: 'assayCommCareGatesRDT',
    externalId: 'CommCareGatesRDT',
    assayTypeId: await assayTypeToId('HIV Qual'),
    deviceTypeId: deviceTypes.CommCareApp.id,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      resultText: { list: true, order: 1, type: 'string', title: 'Result' },
      hcwResult: {
        list: true,
        order: 2,
        type: 'string',
        title: 'HCW Result',
      },
      hcwConfirmatoryResult: {
        list: false,
        order: 3,
        type: 'string',
        title: 'HCW Confirmatory Result',
      },
      hcwTiebreakerResult: {
        list: false,
        order: 4,
        type: 'string',
        title: 'HCW Tiebreaker Result',
      },
    }),
    patientDataSchema: JSON.stringify({
      id: { type: 'string', order: 0, title: 'Patient ID' },
      age: { type: 'int', order: 1, title: 'Age' },
      gender: { type: 'string', order: 2, title: 'Gender' },
      phone: { type: 'string', order: 3, title: 'Phone Number' },
      educationLevel: {
        type: 'string',
        order: 4,
        title: 'Education Level',
      },
      previousTesting: {
        type: 'string',
        order: 5,
        title: 'Previous Testing',
      },
    }),
  })

  const [usCountry] = await knex('Country as c').where({ 'c.a3': 'USA' }).select('c.id', 'c.culture', 'c.timezone')
  const { culture, timezone, id: countryId } = usCountry
  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  // Assign all permissions and admin permissions to Admin user
  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Gates RDT Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone,
    ...auditFields,
  })

  const jobFunctionIdAdmin = await upsertJobFunction(knex, 'Admin', partnerId)

  await knex('JobFunctionPermission').insert([
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.browse.view,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.result.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.device.edit,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.edit },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.edit,
    },
  ])

  const [jobIdAdmin] = await knex('Job').insert([{ personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin }])
  await knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  // Issue Escalation Triggers
  await knex('IssueEscalationTrigger').insert([
    {
      issueTypeId: issueTypes.ResultReceived.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'result-category',
        evaluationParameter: {
          assays: ['CommCareGatesRDT'],
          resultCategory2: ['NotDetected'],
        },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ResultReceived.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'result-category',
        evaluationParameter: {
          assays: ['CommCareGatesRDT'],
          resultCategory1: ['NotDetected'],
          resultCategory2: ['Detected'],
        },
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  await seedIssueEventTriggersForPartner(knex, partnerId)
}
