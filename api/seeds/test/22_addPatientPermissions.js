module.exports = require('../utils').seed(seed, __filename)

const geography = require('./fixtures/geography.json')
const sites = require('./fixtures/sites.json')
const {
  insertStatesAndLgas,
  insertAssayResultCategories,
  insertJobFunctionPermission,
  insertJobFeatures,
} = require('../common')
const {
  updateAssayResultCategoryTreatmentEmphasize,
  insertSites,
  getPermissionModules,
} = require('../utils')
const { allFeatureToId } = require('../../src/shared/dictionary')


const config = require('../../src/config')



async function seed(knex) {
  

  // give admin access to persons and reporters
  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where('name', 'Admin')
    .first('id')

  




  if (!featurePatientCount) {
    await knex('JobFunctionFeature').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        featureId: featurePatientId,
      },
    ])
  }

 
  // features
  await insertJobFunctionPermission(knex, jobFunctionIdClinician, [
    modules.browse.view,
    modules.result.edit,
    modules.assay.edit,
    modules.device.view,
    modules.task.view,
    modules.treatmentStatus.edit,
    modules.site.view,
  ])

  // permissions
  await insertJobFeatures(knex, jobFunctionIdClinician, [
    features.device,
    features.result,
    features.site,
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

  const { id: siteIdMaitama } = await knex('Site')
    .where('externalId', 'Maitama District Hospital')
    .first('id')

  // create Person
  const [personIdMaitama] = await knex('Person').insert({
    userId: userIdMaitama,
    geographyId: siteIdMaitama,
    name: 'Maitama Clinician',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: 'W. Central Africa Standard Time',
    culture: 'en',
    canLogin: true,
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

  const { id: siteIdTownship } = await knex('Site')
    .where('externalId', '2171')
    .first('id')

  // create Person
  const [personIdTownship] = await knex('Person').insert({
    userId: userIdTownship,
    geographyId: siteIdTownship,
    name: 'Township Clinician',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: 'W. Central Africa Standard Time',
    culture: 'en',
    canLogin: true,
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
    .whereIn('externalId', [
      'GxUnknown',
      'GxHcv',
      'GxHiv1Vl',
      'GxHiv1Qual',
      'GxEbola',
    ])
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
