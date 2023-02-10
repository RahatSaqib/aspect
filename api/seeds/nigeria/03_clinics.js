module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const geography = require('./fixtures/geography.json')
const sites = require('./fixtures/sites.json')
const {
  ensureResultTreatmentStatuses,
  upsertStatesAndLgas,
  upsertAssayResultCategories,
  upsertJobFunctionPermission,
  upsertJobFunction,
} = require('../common')
const { updateAssayResultCategoryTreatmentEmphasize, insertSites, getPermissionModules } = require('../utils')
const config = require('../../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  const now = new Date()

  await ensureResultTreatmentStatuses(knex)

  const { id: countryId } = await knex('Country').where('name', 'Nigeria').first('id')

  const { id: partnerId } = await knex('Partner').where({ name: 'Nigeria' }).first('id')

  // have to check if states are already set up because they're now part of common inserts:
  const { stateCount } = await knex('State').count('id as stateCount').first()

  if (stateCount === 0) {
    await upsertStatesAndLgas(knex, countryId, geography.countries[0].states)
  }

  // give admin access to persons and reporters
  const { id: jobFunctionIdAdmin } = await knex('JobFunction').where('name', 'Admin').first('id')

  // persons
  const { id: permissionPersonEditId } = await knex('Permission')
    .where('module', 'person')
    .where('activity', 'edit')
    .first('id')

  const { jobFunctionIdPersonCount } = await knex('JobFunctionPermission')
    .where('jobFunctionId', jobFunctionIdAdmin)
    .where('permissionId', permissionPersonEditId)
    .count('jobFunctionId as jobFunctionIdPersonCount')
    .first()

  if (!jobFunctionIdPersonCount) {
    await knex('JobFunctionPermission').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        permissionId: permissionPersonEditId,
      },
    ])
  }

  const { id: permissionReporterEditId } = await knex('Permission')
    .where('module', 'reporter')
    .where('activity', 'edit')
    .first('id')

  const { jobFunctionIdReporterCount } = await knex('JobFunctionPermission')
    .where('jobFunctionId', jobFunctionIdAdmin)
    .where('permissionId', permissionReporterEditId)
    .count('jobFunctionId as jobFunctionIdReporterCount')
    .first()

  if (!jobFunctionIdReporterCount) {
    await knex('JobFunctionPermission').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        permissionId: permissionReporterEditId,
      },
    ])
  }

  // set up result category assays:
  // HCV categories
  const { id: geneXpertHcvAssayId } = await knex('Assay').where('externalId', 'GxHcv').first('id')
  await upsertAssayResultCategories(geneXpertHcvAssayId, ['Detected', 'Invalid', 'NoResult', 'Error'])

  // MTB-Rif categories
  const { id: geneXpertMtbRifAssayId } = await knex('Assay').where('externalId', 'GxMtbRif').first('id')
  await upsertAssayResultCategories(knex, geneXpertMtbRifAssayId, [
    'Detected',
    'NotDetected',
    'Indeterminate',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // MTB-Rif ULTRA categories
  const { id: geneXpertMtbRifUltraAssayId } = await knex('Assay').where('externalId', 'GxMtbRifUltra').first('id')
  await upsertAssayResultCategories(knex, geneXpertMtbRifUltraAssayId, [
    'Detected',
    'Trace Detected',
    'NotDetected',
    'Indeterminate',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // HIV-VL categories
  const { id: geneXpertHivVlAssayId } = await knex('Assay').where('externalId', 'GxHiv1Vl').first('id')
  await upsertAssayResultCategories(knex, geneXpertHivVlAssayId, [
    'LessThan1000',
    'MoreThan1000',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // HIV-QUAL categories
  const { id: geneXpertHivQualAssayId } = await knex('Assay').where('externalId', 'GxHiv1Qual').first('id')
  await upsertAssayResultCategories(knex, geneXpertHivQualAssayId, [
    'Detected',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // Ebola categories
  const { id: geneXpertEbolaAssayId } = await knex('Assay').where('externalId', 'GxEbola').first('id')
  await upsertAssayResultCategories(knex, geneXpertEbolaAssayId, [
    'Detected',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  await updateAssayResultCategoryTreatmentEmphasize(knex)

  await insertSites(knex, partnerId, countryId, sites.sites)

  // add reporter logins for testing
  const { id: adminId } = await knex('User').where('name', 'admin').first('id')

  const jobFunctionIdClinician = await upsertJobFunction(knex, 'Clinician', partnerId)

  const modules = await getPermissionModules(knex)

  // permissions
  await upsertJobFunctionPermission(knex, jobFunctionIdClinician, [
    modules.browse.view,
    modules.result.edit,
    modules.assay.edit,
    modules.device.view,
    modules.task.view,
    modules.treatmentStatus.edit,
    modules.site.view,
  ])
  // Clinician in Maitama
  // Create User
  const [userIdMaitama] = await knex('User').insert({
    name: 'maitama_clinician',
    password: bcrypt.hashSync('71oB25gR', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const { id: siteIdMaitama } = await knex('Site').where('externalId', 'Maitama District Hospital').first('id')

  // create Person
  const [personIdMaitama] = await knex('Person').insert({
    userId: userIdMaitama,
    geographyId: siteIdMaitama,
    name: 'Maitama Clinician',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: 'W. Central Africa Standard Time',
    culture: 'en-US',
    canLogIn: true,
    createdBy: adminId,
    createdOn: now,
    updatedBy: adminId,
    updatedOn: now,
  })

  // job function for user
  const [jobIdMaitama] = await knex('Job').insert({
    personId: personIdMaitama,
    jobFunctionId: jobFunctionIdClinician,
  })

  // context for user
  await knex('JobContext').insert({
    jobId: jobIdMaitama,
    siteId: siteIdMaitama,
  })

  // Clinician in TOWNSHIP CLINIC (2171)
  // Create User
  const [userIdTownship] = await knex('User').insert({
    name: 'township_clinician',
    password: bcrypt.hashSync('uXih0812', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const { id: siteIdTownship } = await knex('Site').where('externalId', '2171').first('id')

  // create Person
  const [personIdTownship] = await knex('Person').insert({
    userId: userIdTownship,
    geographyId: siteIdTownship,
    name: 'Township Clinician',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: 'W. Central Africa Standard Time',
    culture: 'en-US',
    canLogIn: true,
    createdBy: adminId,
    createdOn: now,
    updatedBy: adminId,
    updatedOn: now,
  })

  // job function for user
  const [jobIdTownship] = await knex('Job').insert({
    personId: personIdTownship,
    jobFunctionId: jobFunctionIdClinician,
  })

  // context for user
  await knex('JobContext').insert({
    jobId: jobIdTownship,
    siteId: siteIdTownship,
  })

  // fix assay patient data schema for TB:
  await knex('Assay')
    .whereIn('externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .update(
      'patientDataSchema',
      JSON.stringify({
        id: {
          title: 'Patient ID',
          type: 'string',
          order: 0,
        },
        gender: {
          title: 'Gender',
          type: 'string',
          order: 1,
        },
        age: {
          title: 'Age',
          type: 'number',
          order: 2,
        },
        name: {
          title: 'Name',
          type: 'string',
          order: 3,
        },
        hivStatus: {
          title: 'HIV Status',
          type: 'string',
          order: 4,
        },
        drSuspect: {
          title: 'DR Suspect?',
          type: 'string',
          order: 5,
        },
        referringFacility: {
          title: 'Referring Facility',
          type: 'string',
          order: 6,
        },
        referringClinicianPhone: {
          title: 'Referring Clinician or Facility Phone Number (if known)',
          type: 'string',
          order: 7,
        },
      })
    )

  // fix assay patient data schema for all other assays
  await knex('Assay')
    .whereIn('externalId', ['GxUnknown', 'GxHcv', 'GxHiv1Vl', 'GxHiv1Qual', 'GxEbola'])
    .update(
      'patientDataSchema',
      JSON.stringify({
        id: {
          title: 'Patient ID',
          type: 'string',
          order: 0,
        },
        gender: {
          title: 'Gender',
          type: 'string',
          order: 1,
        },
        age: {
          title: 'Age',
          type: 'number',
          order: 2,
        },
        name: {
          title: 'Name',
          type: 'string',
          order: 3,
        },
        referringFacility: {
          title: 'Referring Facility',
          type: 'string',
          order: 4,
        },
        referringClinicianPhone: {
          title: 'Referring Clinician or Facility Phone Number (if known)',
          type: 'string',
          order: 5,
        },
      })
    )
}
