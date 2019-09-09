module.exports = require('../utils').seed(seed, __filename)

const geography = require('./fixtures/geography.json')
const sites = require('./fixtures/sites.json')
const {
  insertStatesAndLgas,
  insertAssayResultCategories,
} = require('../common')
const {
  updateAssayResultCategoryTreatmentEmphasize,
  insertSites,
} = require('../utils')

async function seed(knex) {
  const { id: countryId } = await knex('Country')
    .where('name', 'Nigeria')
    .first('id')

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Nigeria' })
    .first('id')

  // have to check if states are already set up because they're now part of common inserts:
  const { stateCount } = await knex('State')
    .count('id as stateCount')
    .first()

  if (stateCount === 0) {
    await insertStatesAndLgas(knex, countryId, geography.countries[0].states)
  }

  // give admin access to persons and reporters
  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where('name', 'Admin')
    .first('id')

  // persons
  const { id: permissionPersonAdminId } = await knex('Permission')
    .where('module', 'person')
    .where('activity', 'admin')
    .first('id')

  const { jobFunctionIdPersonCount } = await knex('JobFunctionPermission')
    .where('jobFunctionId', jobFunctionIdAdmin)
    .where('permissionId', permissionPersonAdminId)
    .count('jobFunctionId as jobFunctionIdPersonCount')
    .first()

  if (!jobFunctionIdPersonCount) {
    await knex('JobFunctionPermission').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        permissionId: permissionPersonAdminId,
      },
    ])
  }

  const { id: permissionReporterAdminId } = await knex('Permission')
    .where('module', 'reporter')
    .where('activity', 'admin')
    .first('id')

  const { jobFunctionIdReporterCount } = await knex('JobFunctionPermission')
    .where('jobFunctionId', jobFunctionIdAdmin)
    .where('permissionId', permissionReporterAdminId)
    .count('jobFunctionId as jobFunctionIdReporterCount')
    .first()

  if (!jobFunctionIdReporterCount) {
    await knex('JobFunctionPermission').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        permissionId: permissionReporterAdminId,
      },
    ])
  }

  // reporters
  const { id: featurePersonId } = await knex('Feature')
    .where('module', 'person')
    .first('id')

  const { featurePersonCount } = await knex('JobFunctionFeature')
    .where('jobFunctionId', jobFunctionIdAdmin)
    .where('featureId', featurePersonId)
    .count('featureId as featurePersonCount')
    .first()

  if (!featurePersonCount) {
    await knex('JobFunctionFeature').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        featureId: featurePersonId,
      },
    ])
  }

  const { id: featureReporterId } = await knex('Feature')
    .where('module', 'reporter')
    .first('id')

  const { featureReporterCount } = await knex('JobFunctionFeature')
    .where('jobFunctionId', jobFunctionIdAdmin)
    .where('featureId', featureReporterId)
    .count('featureId as featureReporterCount')
    .first()

  if (!featureReporterCount) {
    await knex('JobFunctionFeature').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        featureId: featureReporterId,
      },
    ])
  }

  // set up result category assays:
  // HCV categories
  const { id: geneXpertHcvAssayId } = await knex('Assay')
    .where('externalId', 'GxHcv')
    .first('id')
  await insertAssayResultCategories(geneXpertHcvAssayId, [
    'Detected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // MTB-Rif categories
  const { id: geneXpertMtbRifAssayId } = await knex('Assay')
    .where('externalId', 'GxMtbRif')
    .first('id')
  await insertAssayResultCategories(knex, geneXpertMtbRifAssayId, [
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
  await insertAssayResultCategories(knex, geneXpertMtbRifUltraAssayId, [
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
  await insertAssayResultCategories(knex, geneXpertHivVlAssayId, [
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
  await insertAssayResultCategories(knex, geneXpertHivQualAssayId, [
    'Detected',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // Ebola categories
  const { id: geneXpertEbolaAssayId } = await knex('Assay')
    .where('externalId', 'GxEbola')
    .first('id')
  await insertAssayResultCategories(knex, geneXpertEbolaAssayId, [
    'Detected',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  await updateAssayResultCategoryTreatmentEmphasize(knex)

  await insertSites(knex, partnerId, countryId, sites.sites)
}
