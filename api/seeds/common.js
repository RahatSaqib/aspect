const _ = require('lodash')
const Promise = require('bluebird')

const utils = require('./utils')
const gxPatientDataSchema = require('./fixtures/geneXpertDevice/geneXpertPatientDataSchema.json')
const geneXpertResultDataSchemaHiv = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHiv.json')
const geneXpertResultDataSchema = require('./fixtures/geneXpertDevice/geneXpertResultDataSchema.json')
const geneXpertResultDataSchemaHcv = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHcv.json')
const {
  allFeatureToId,
  deviceStatusToId,
  allDeviceTypeCategoryToId,
  allAssayTypeToId,
  allResultSourceToId,
} = require('../src/shared/dictionary')

async function commonInserts(
  knex,
  partnerId,
  adminId,
  geography,
  countryAbbreviation,
  deviceApiToken = null
) {
  const now = new Date()
  utils.hasSeededStaticData = true
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [modules, features] = await Promise.all([
    utils.getPermissionModules(knex),
    allFeatureToId(),
  ])
  const countries = {}
  await Promise.each(geography.countries, async country => {
    const countryData = _.pick(country, [
      'abbreviation',
      'name',
      'a3',
      'culture',
      'countryCode',
      'stateLabel',
      'lgaLabel',
      'timezone',
      'portNumber',
      'exportColumns',
      'inventoryDaysThreshold',
      'monthStartsOnDay',
    ])
    const [countryId] = await knex('Country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    const [countryGeographyId] = await knex('Geography').insert({
      countryId,
    })
    countryData.geographyId = countryGeographyId
  })
  const { culture, timezone, id: countryId, geographyId } = countries[
    countryAbbreviation
  ]
  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone,
    ...auditFields,
  })

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })
  await insertJobFunctionPermission(knex, jobFunctionIdAdmin, [
    modules.browse.view,
    modules.result.admin,
    modules.assay.admin,
    modules.device.admin,
    modules.treatmentStatus.admin,
    modules.site.admin,
  ])

  await insertJobFeatures(knex, jobFunctionIdAdmin, [
    features.device,
    features.result,
    features.site,
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])

  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId,
  })

  const [jobFunctionIdRegionalOfficer] = await knex('JobFunction').insert({
    name: 'Regional Officer',
    partnerId,
  })
  await insertJobFunctionPermission(knex, jobFunctionIdRegionalOfficer, [
    modules.browse.view,
    modules.result.edit,
    modules.assay.view,
    modules.device.view,
    modules.treatmentStatus.view,
    modules.site.view,
  ])
  await insertJobFeatures(knex, jobFunctionIdRegionalOfficer, [
    features.device,
    features.result,
    features.site,
  ])

  const [jobFunctionIdLabUser] = await knex('JobFunction').insert({
    name: 'Lab User',
    partnerId,
  })
  await insertJobFunctionPermission(knex, jobFunctionIdLabUser, [
    modules.browse.view,
    modules.result.edit,
    modules.assay.view,
    modules.device.view,
    modules.site.view,
    modules.treatmentStatus.view,
  ])
  await insertJobFeatures(knex, jobFunctionIdLabUser, [
    features.device,
    features.result,
    features.site,
  ])
  if (deviceApiToken)
    await insertGxAlertDevice(
      knex,
      countryId,
      partnerId,
      auditFields,
      deviceApiToken
    )
}
async function insertJobFunctionPermission(
  knex,
  jobFunctionId,
  jobPermissions
) {
  const JobFunctionPermission = _.map(jobPermissions, permissionId =>
    Object.assign(
      {},
      {
        jobFunctionId,
        permissionId,
      }
    )
  )
  return knex('JobFunctionPermission').insert(JobFunctionPermission)
}
async function insertJobFeatures(knex, jobFunctionId, jobFeatures) {
  const JobFunctionFeature = _.map(jobFeatures, featureId =>
    Object.assign(
      {},
      {
        jobFunctionId,
        featureId,
      }
    )
  )
  return knex('JobFunctionFeature').insert(JobFunctionFeature)
}
async function insertGxAlertDevice(
  knex,
  countryId,
  partnerId,
  auditFields,
  deviceApiToken
) {
  const {
    'Information System': deviceTypeCategoryInformationSystem,
  } = await allDeviceTypeCategoryToId()
  const [deviceTypeId] = await knex('DeviceType')
    .insert({
      externalId: 'GxAlert',
      name: 'GxAlert',
      manufacturer: 'SystemOne',
      plugin: 'gxalert',
      deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
    })
    .returning('Id')
  const { countryGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first('id as countryGeographyId')
  const site = {
    ...auditFields,
    name: 'GxAlert Site',
    shortName: 'GxA Site',
    externalId: 'gxalert',
    partnerId,
    geographyId: countryGeographyId,
    createdOn: new Date(),
    updatedOn: new Date(),
  }
  const gxAlertSiteId = await knex('Site').insert(site)

  // insert GxAlert device
  const gxAlertDeviceId = await knex('Device').insert({
    ...auditFields,
    name: 'GxAlert',
    deviceStatusId: await deviceStatusToId('approved'),
    partnerId,
    geographyId: countryGeographyId,
    siteId: gxAlertSiteId,
    createdOn: new Date(),
    updatedOn: new Date(),
    lastPingOn: new Date(),
    lastSeenOn: new Date(),
    deviceTypeId,
  })

  await knex('DeviceApiKey').insert({
    token: deviceApiToken,
    revoked: 0,
    partnerId,
    geographyId: countryGeographyId,
    deviceId: gxAlertDeviceId,
    ...auditFields,
  })
}
async function addGeneXpertDeviceTypeAndAssays(
  knex,
  assayExternalIds,
  patientDataSchema
) {
  let geneXpertPatientDataSchema
  if (patientDataSchema)
    geneXpertPatientDataSchema = JSON.stringify(patientDataSchema)
  else geneXpertPatientDataSchema = JSON.stringify(gxPatientDataSchema)

  // Add device types
  const { Lab: deviceTypeCategoryLab } = await allDeviceTypeCategoryToId()

  const [deviceTypeGeneXpertId] = await knex('DeviceType').insert({
    externalId: 'CepheidGeneXpert',
    name: 'GeneXpert',
    manufacturer: 'Cepheid',
    plugin: 'gxconnect',
    deviceTypeCategoryId: deviceTypeCategoryLab,
  })

  // Add assays
  const {
    DiagnosticDevice: resultSourceDiagnosticId,
  } = await allResultSourceToId()

  const {
    'MTB/Rif': assayTypeMTBRifId,
    Ebola: assayTypeEbolaId,
    'HIV VL': assayTypeHivVlId,
    'HIV Qual': assayTypeHivQualId,
    HCV: assayTypeHcvId,
    Unknown: assayTypeUnknownId,
  } = await allAssayTypeToId()

  if (_.includes(assayExternalIds, 'GxUnknown'))
    await knex('Assay').insert({
      name: 'GeneXpert Unknown',
      i18nKey: 'assayGeneXpertUnknown',
      externalId: 'GxUnknown',
      assayTypeId: assayTypeUnknownId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX UK',
    })
  if (_.includes(assayExternalIds, 'GxHcv'))
    await knex('Assay').insert({
      name: 'GeneXpert HCV',
      i18nKey: 'assayGeneXpertHcv',
      externalId: 'GxHcv',
      assayTypeId: assayTypeHcvId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      resultCategory1Label: 'HCV',
      resultCategory1i18nKey: 'resultCategoryHcv',
      resultCategory2Label: null,
      resultCategory2i18nKey: null,
      resultDataSchema: JSON.stringify(geneXpertResultDataSchemaHcv),
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX HCV',
    })
  if (_.includes(assayExternalIds, 'GxMtbRif'))
    await knex('Assay').insert({
      name: 'GeneXpert MTB/Rif',
      i18nKey: 'assayGeneXpertMtbRif',
      externalId: 'GxMtbRif',
      assayTypeId: assayTypeMTBRifId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      resultCategory1Label: 'MTB',
      resultCategory1i18nKey: 'resultCategoryMtb',
      resultCategory2Label: 'Rif',
      resultCategory2i18nKey: 'resultCategoryRif',
      resultDataSchema: JSON.stringify(geneXpertResultDataSchema),
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX MTB/Rif',
    })
  if (_.includes(assayExternalIds, 'GxMtbRifUltra'))
    await knex('Assay').insert({
      name: 'GeneXpert MTB/Rif Ultra',
      i18nKey: 'assayGeneXpertMtbRifUltra',
      externalId: 'GxMtbRifUltra',
      assayTypeId: assayTypeMTBRifId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      resultCategory1Label: 'MTB',
      resultCategory1i18nKey: 'resultCategoryMtb',
      resultCategory2Label: 'Rif',
      resultCategory2i18nKey: 'resultCategoryRif',
      resultDataSchema: JSON.stringify(geneXpertResultDataSchema),
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX MTB/ULTRA',
    })
  if (_.includes(assayExternalIds, 'GxHiv1Vl'))
    await knex('Assay').insert({
      name: 'GeneXpert HIV-1 VL',
      i18nKey: 'assayGeneXpertHiv1Vl',
      externalId: 'GxHiv1Vl',
      assayTypeId: assayTypeHivVlId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      resultCategory1Label: 'HIV',
      resultCategory1i18nKey: 'resultCategoryHiv',
      resultCategory2Label: null,
      resultCategory2i18nKey: null,
      resultDataSchema: JSON.stringify(geneXpertResultDataSchemaHiv),
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX HIV VL',
    })
  if (_.includes(assayExternalIds, 'GxHiv1Qual'))
    await knex('Assay').insert({
      name: 'GeneXpert HIV-1 Qual',
      i18nKey: 'assayGeneXpertHiv1Qual',
      externalId: 'GxHiv1Qual',
      assayTypeId: assayTypeHivQualId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      resultCategory1Label: 'HIV',
      resultCategory1i18nKey: 'resultCategoryHiv',
      resultCategory2Label: null,
      resultCategory2i18nKey: null,
      resultDataSchema: JSON.stringify(geneXpertResultDataSchemaHiv),
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX HIV Qual',
    })
  if (_.includes(assayExternalIds, 'GxEbola'))
    await knex('Assay').insert({
      name: 'GeneXpert Ebola',
      i18nKey: 'assayGeneXpertEbola',
      externalId: 'GxEbola',
      assayTypeId: assayTypeEbolaId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      resultCategory1Label: 'GP',
      resultCategory1i18nKey: 'resultCategoryEbolaGp',
      resultCategory2Label: 'NP',
      resultCategory2i18nKey: 'resultCategoryEbolaNp',
      resultDataSchema: JSON.stringify(geneXpertResultDataSchema),
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX Ebola',
    })
}
module.exports = {
  commonInserts,
  insertGxAlertDevice,
  insertJobFunctionPermission,
  insertJobFeatures,
  addGeneXpertDeviceTypeAndAssays,
}
