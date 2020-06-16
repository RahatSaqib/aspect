module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const geography = require('./fixtures/geography.json')
const { allDiseaseToId } = require('../../src/shared/dictionary')

const {
  ensureResultTreatmentStatuses,
  upsertStatesAndLgas,
  upsertAssayResultCategories,
} = require('../common')
const {
  updateAssayResultCategoryTreatmentEmphasize,
  insertSites,
} = require('../utils')
const config = require('../../src/config')
const sites = require('./fixtures/sites.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  const now = new Date()

  await ensureResultTreatmentStatuses(knex)

  const { id: countryId } = await knex('Country').where('a3', 'LSO').first('id')

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Lesotho' })
    .first('id')

  // have to check if states are already set up because they're now part of common inserts:
  const { stateCount } = await knex('State').count('id as stateCount').first()

  if (stateCount === 0) {
    await upsertStatesAndLgas(knex, countryId, geography.countries[0].states)
  }
  await insertSites(knex, partnerId, countryId, sites.sites)

  const { id: jobFunctionIdLab } = await knex('JobFunction')
    .where('name', 'Lab User')
    .first('id')

  // MTB-Rif categories
  const { id: geneXpertMtbRifAssayId } = await knex('Assay')
    .where('externalId', 'GxMtbRif')
    .first('id')
  await upsertAssayResultCategories(knex, geneXpertMtbRifAssayId, [
    'Detected',
    'NotDetected',
    'Indeterminate',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // MTB-Rif ULTRA categories
  const { id: geneXpertMtbRifUltraAssayId } = await knex('Assay')
    .where('externalId', 'GxMtbRifUltra')
    .first('id')
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
  const { id: geneXpertHivVlAssayId } = await knex('Assay')
    .where('externalId', 'GxHiv1Vl')
    .first('id')
  await upsertAssayResultCategories(knex, geneXpertHivVlAssayId, [
    'LessThan1000',
    'MoreThan1000',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // HIV-QUAL categories
  const { id: geneXpertHivQualAssayId } = await knex('Assay')
    .where('externalId', 'GxHiv1Qual')
    .first('id')
  await upsertAssayResultCategories(knex, geneXpertHivQualAssayId, [
    'Detected',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  await updateAssayResultCategoryTreatmentEmphasize(knex)

  // add reporter logins for testing
  const { id: adminId } = knex('User').where('name', 'admin').first('id')

  const [userIdMaseru] = await knex('User').insert({
    name: 'Maseru_lab',
    password: bcrypt.hashSync('18oC25gR', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const { id: siteIdMaseru } = await knex('Site')
    .where('externalId', 'Maseru')
    .first('id')

  // create Person
  const [personIdMaseru] = await knex('Person').insert({
    userId: userIdMaseru,
    geographyId: siteIdMaseru,
    name: 'Maseru Lab',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: 'South Africa Standard Time',
    culture: 'en',
    canLogin: true,
    createdBy: adminId,
    createdOn: now,
    updatedBy: adminId,
    updatedOn: now,
  })
  const diseases = await allDiseaseToId()
  // job function for user
  const [joibIdMaseru] = await knex('Job').insert({
    personId: personIdMaseru,
    jobFunctionId: jobFunctionIdLab,
  })

  // context for user
  await knex('JobContext').insert({
    jobId: joibIdMaseru,
    diseaseId: diseases.hiv,
  })
  // Create User
  const [userIdTeyateyaneng] = await knex('User').insert({
    name: 'teyateyaneng_lab',
    password: bcrypt.hashSync('qXdg0888', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const { id: siteIdTeyateyaneng } = await knex('Site')
    .where('externalId', 'Teyateyaneng')
    .first('id')

  // create Person
  const [personIdTeyateyaneng] = await knex('Person').insert({
    userId: userIdTeyateyaneng,
    geographyId: siteIdTeyateyaneng,
    name: 'Teyateyaneng Lab',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: 'South Africa Standard Time',
    culture: 'en',
    canLogin: true,
    createdBy: adminId,
    createdOn: now,
    updatedBy: adminId,
    updatedOn: now,
  })

  // job function for user
  const [jobIdLab2] = await knex('Job').insert({
    personId: personIdTeyateyaneng,
    jobFunctionId: jobFunctionIdLab,
  })
  // context for user
  await knex('JobContext').insert({
    jobId: jobIdLab2,
    diseaseId: diseases.tb,
  })
}
