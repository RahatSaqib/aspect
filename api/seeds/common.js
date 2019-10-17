const _ = require('lodash')
const Promise = require('bluebird')

const utils = require('./utils')
const { query } = require('../src/db')

const gxPatientDataSchema = require('./fixtures/geneXpertDevice/geneXpertPatientDataSchema.json')
const geneXpertResultDataSchemaHiv = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHiv.json')
const geneXpertResultDataSchema = require('./fixtures/geneXpertDevice/geneXpertResultDataSchema.json')
const geneXpertResultDataSchemaHcv = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHcv.json')
const {
  allFeatureToId,
  deviceStatusToId,
  allDeviceTypeCategoryToId,
  deviceTypeCategoryToId,
  allAssayTypeToId,
  allResultSourceToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')

async function commonUpserts(
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
    let { countryId, countryGeographyId } =
      (await knex('Country as c')
        .leftJoin('Geography as g', 'c.id', 'g.countryId')
        .where('c.abbreviation', country.abbreviation)
        .andWhere(function() {
          this.whereNull('g.stateId')
        })
        .andWhere(function() {
          this.whereNull('g.lgaId')
        })
        .first('c.id as countryId', 'g.id as countryGeographyId')) || {}
    if (!countryId) {
      ;[countryId] = await knex('Country').insert(countryData)
    }
    if (!countryGeographyId) {
      ;[countryGeographyId] = await knex('Geography').insert({
        countryId,
      })
    }
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    countryData.states = {}
    countryData.geographyId = countryGeographyId

    await upsertStatesAndLgas(knex, countryId, country.states)
  })

  const { culture, timezone, id: countryId, geographyId } = countries[
    countryAbbreviation
  ]
  let { id: adminPersonId } =
    (await knex('Person')
      .where({
        userId: adminId,
        name: 'Admin',
        geographyId,
      })
      .first('id')) || {}
  if (!adminPersonId) {
    ;[adminPersonId] = await knex('Person').insert({
      userId: adminId,
      name: 'Admin',
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      geographyId,
      culture,
      timezone,
      ...auditFields,
    })
  }
  const jobFunctionIdAdmin = await upsertJobFunction(
    knex,
    'Admin',
    partnerId,
    [
      modules.browse.view,
      modules.result.admin,
      modules.assay.admin,
      modules.device.admin,
      modules.treatmentStatus.admin,
      modules.site.admin,
      modules.person.admin,
      modules.reporter.admin,
    ],
    [
      features.device,
      features.result,
      features.site,
      features.person,
      features.reporter,
    ]
  )
  let { id: jobIdAdmin } =
    (await knex('Job')
      .where({
        personId: adminPersonId,
        jobFunctionId: jobFunctionIdAdmin,
      })
      .first('id')) || {}
  if (!jobIdAdmin) {
    ;[jobIdAdmin] = await knex('Job').insert({
      personId: adminPersonId,
      jobFunctionId: jobFunctionIdAdmin,
    })
  }
  const { id: jobContextIdAdmin } =
    (await knex('JobContext')
      .where({
        jobId: jobIdAdmin,
        geographyId,
      })
      .first('id')) || {}
  if (!jobContextIdAdmin) {
    await knex('JobContext').insert({
      jobId: jobIdAdmin,
      geographyId,
    })
  }
  await upsertJobFunction(
    knex,
    'Regional Officer',
    partnerId,
    [
      modules.browse.view,
      modules.result.edit,
      modules.assay.view,
      modules.device.view,
      modules.treatmentStatus.view,
      modules.site.view,
      modules.person.view,
    ],
    [features.device, features.result, features.site, features.person]
  )
  await upsertJobFunction(
    knex,
    'Lab User',
    partnerId,
    [
      modules.browse.view,
      modules.result.edit,
      modules.assay.view,
      modules.device.view,
      modules.site.view,
      modules.treatmentStatus.view,
    ],
    [features.device, features.result, features.site]
  )
  if (deviceApiToken)
    await upsertGxAlertDevice(
      knex,
      countryId,
      partnerId,
      auditFields,
      deviceApiToken
    )
}

async function upsertJobFunction(
  knex,
  jobFunctionName,
  partnerId,
  permissions,
  features
) {
  let { id: jobFunctionId } =
    (await knex('JobFunction')
      .where({
        name: jobFunctionName,
        partnerId,
      })
      .first('id')) || {}
  if (!jobFunctionId) {
    ;[jobFunctionId] = await knex('JobFunction').insert({
      name: jobFunctionName,
      partnerId,
    })
  }
  await upsertJobFunctionPermission(knex, jobFunctionId, permissions)
  await upsertJobFeatures(knex, jobFunctionId, features)
  return jobFunctionId
}

async function upsertJobFunctionPermission(
  knex,
  jobFunctionId,
  jobPermissions
) {
  const existingJobFunctionPermissions = await knex('JobFunctionPermission')
    .where({ jobFunctionId })
    .pluck('permissionId')
  const JobFunctionPermission = _.map(
    jobPermissions.filter(
      permissionId => !existingJobFunctionPermissions.includes(permissionId)
    ),
    permissionId =>
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

async function upsertJobFeatures(knex, jobFunctionId, jobFeatures) {
  const existingJobFunctionFeatures = await knex('JobFunctionFeature')
    .where({ jobFunctionId })
    .pluck('featureId')
  const JobFunctionFeature = _.map(
    jobFeatures.filter(
      featureId => !existingJobFunctionFeatures.includes(featureId)
    ),
    featureId =>
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

async function upsertGxAlertDevice(
  knex,
  countryId,
  partnerId,
  auditFields,
  deviceApiToken
) {
  let { id: deviceTypeId } =
    (await knex('DeviceType')
      .where('externalId', 'GxAlert')
      .first('id')) || {}
  if (!deviceTypeId) {
    const deviceTypeCategoryInformationSystem = await deviceTypeCategoryToId(
      'Information System'
    )
    ;[deviceTypeId] = await knex('DeviceType').insert({
      externalId: 'GxAlert',
      name: 'GxAlert',
      manufacturer: 'SystemOne',
      plugin: 'gxalert',
      deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
    })
  }
  const { countryGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first('id as countryGeographyId')

  let { id: gxAlertSiteId } =
    (await knex('Site')
      .where({
        externalId: 'gxalert',
        partnerId,
        geographyId: countryGeographyId,
      })
      .first('id')) || {}
  if (!gxAlertSiteId) {
    ;[gxAlertSiteId] = await knex('Site').insert({
      ...auditFields,
      name: 'GxAlert Site',
      shortName: 'GxA Site',
      externalId: 'gxalert',
      partnerId,
      geographyId: countryGeographyId,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
  }

  let { id: gxAlertDeviceId } =
    (await knex('Device')
      .where({
        deviceTypeId,
        partnerId,
        geographyId: countryGeographyId,
        siteId: gxAlertSiteId,
      })
      .first('id')) || {}
  if (!gxAlertDeviceId) {
    ;[gxAlertDeviceId] = await knex('Device').insert({
      ...auditFields,
      name: 'GxAlert',
      deviceStatusId: await deviceStatusToId('approved'),
      partnerId,
      geographyId: countryGeographyId,
      siteId: gxAlertSiteId,
      lastPingOn: new Date(),
      lastSeenOn: new Date(),
      deviceTypeId,
    })
  }

  const deviceApiKey = {
    token: deviceApiToken,
    revoked: 0,
    partnerId,
    geographyId: countryGeographyId,
    deviceId: gxAlertDeviceId,
  }
  const { id: gxAlertDeviceApiKeyId } =
    (await knex('DeviceApiKey')
      .where({
        token: deviceApiToken,
        deviceId: gxAlertDeviceId,
      })
      .first('id')) || {}
  if (!gxAlertDeviceApiKeyId) {
    await knex('DeviceApiKey').insert({
      ...deviceApiKey,
      ...auditFields,
    })
  } else {
    await knex('DeviceApiKey')
      .where('id', gxAlertDeviceApiKeyId)
      .update({
        ...deviceApiKey,
        updatedBy: auditFields.updatedBy,
        updatedOn: auditFields.updatedOn,
      })
  }
}

async function upsertGeneXpertDeviceTypeAndAssays(
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

  if (_.includes(assayExternalIds, 'GxUnknown')) {
    await upsertAssay(knex, {
      name: 'GeneXpert Unknown',
      i18nKey: 'assayGeneXpertUnknown',
      externalId: 'GxUnknown',
      assayTypeId: assayTypeUnknownId,
      deviceTypeId: deviceTypeGeneXpertId,
      resultSourceId: resultSourceDiagnosticId,
      patientDataSchema: geneXpertPatientDataSchema,
      abbreviation: 'GX UK',
    })
  }
  if (_.includes(assayExternalIds, 'GxHcv')) {
    const geneXpertHcvAssayId = await upsertAssay(knex, {
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
    await upsertAssayResultCategories(geneXpertHcvAssayId, [
      'Detected',
      'Invalid',
      'NoResult',
      'Error',
    ])
  }
  if (_.includes(assayExternalIds, 'GxMtbRif')) {
    const geneXpertMtbRifAssayId = await upsertAssay(knex, {
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
    await upsertAssayResultCategories(knex, geneXpertMtbRifAssayId, [
      'Detected',
      'NotDetected',
      'Indeterminate',
      'Invalid',
      'NoResult',
      'Error',
    ])
  }
  if (_.includes(assayExternalIds, 'GxMtbRifUltra')) {
    const geneXpertMtbRifUltraAssayId = await upsertAssay(knex, {
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
    await upsertAssayResultCategories(knex, geneXpertMtbRifUltraAssayId, [
      'Detected',
      'Trace Detected',
      'NotDetected',
      'Indeterminate',
      'Invalid',
      'NoResult',
      'Error',
    ])
  }
  if (_.includes(assayExternalIds, 'GxHiv1Vl')) {
    const geneXpertHivVlAssayId = await upsertAssay(knex, {
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
    await upsertAssayResultCategories(knex, geneXpertHivVlAssayId, [
      'LessThan1000',
      'MoreThan1000',
      'NotDetected',
      'Invalid',
      'NoResult',
      'Error',
    ])
  }
  if (_.includes(assayExternalIds, 'GxHiv1Qual')) {
    const geneXpertHivQualAssayId = await upsertAssay(knex, {
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
    await upsertAssayResultCategories(knex, geneXpertHivQualAssayId, [
      'Detected',
      'NotDetected',
      'Invalid',
      'NoResult',
      'Error',
    ])
  }
  if (_.includes(assayExternalIds, 'GxEbola')) {
    const geneXpertEbolaAssayId = await upsertAssay(knex, {
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
    await upsertAssayResultCategories(knex, geneXpertEbolaAssayId, [
      'Detected',
      'NotDetected',
      'Invalid',
      'NoResult',
      'Error',
    ])
  }

  // now that we added assays and result categories, update which categories requires treatment and what should be emphasized
  await utils.updateAssayResultCategoryTreatmentEmphasize(knex)
}

async function upsertAssay(knex, assay) {
  let { id: assayId } =
    (await knex('Assay')
      .where({ externalId: assay.externalId })
      .first('id')) || {}
  if (!assayId) {
    ;[assayId] = await knex('Assay').insert(assay)
  } else {
    await knex('Assay')
      .where('id', assayId)
      .update(assay)
  }
  return assayId
}

async function upsertStatesAndLgas(knex, countryId, states) {
  await Promise.all(
    _.map(states || [], async state => {
      const stateData = _.pick(state, ['abbreviation', 'name'])
      let { stateId, stateGeographyId } =
        (await knex('State as s')
          .leftJoin('Geography as g', 's.id', 'g.stateId')
          .where('g.countryId', countryId)
          .andWhere('s.name', state.name)
          .andWhere(function() {
            this.whereNull('g.lgaId')
          })
          .first('s.id as stateId', 'g.id as stateGeographyId')) || {}
      if (!stateId) {
        ;[stateId] = await knex('State').insert(stateData)
      }
      if (!stateGeographyId) {
        ;[stateGeographyId] = await knex('Geography').insert({
          countryId,
          stateId,
        })
      }
      stateData.id = stateId
      stateData.lgas = {}
      stateData.geographyId = stateGeographyId
      await Promise.all(
        _.map(state.lgas || [], async lga => {
          const lgaData = _.pick(lga, ['name'])
          let { lgaId, lgaGeographyId } =
            (await knex('Lga as l')
              .leftJoin('Geography as g', 'l.id', 'g.lgaId')
              .where('g.stateId', stateId)
              .andWhere('l.name', lga.name)
              .first('l.id as lgaId', 'g.id as lgaGeographyId')) || {}
          if (!lgaId) {
            ;[lgaId] = await knex('Lga').insert(lgaData)
          }
          if (!lgaGeographyId) {
            ;[lgaGeographyId] = await knex('Geography').insert({
              countryId,
              stateId,
              lgaId,
            })
          }
          lgaData.id = lgaId
          stateData.lgas[lga.name] = lgaData
          lgaData.sites = {}
          lgaData.geographyId = lgaGeographyId
        })
      )
    })
  )
}

// adds the categories (array of externalIds) to the given assayId
// safe to execute multiple times - will only add new entires
async function upsertAssayResultCategories(knex, assayId, categories) {
  await Promise.all(
    _.map(categories || [], async category => {
      const resultCategoryId = await resultCategoryToId(category)

      await query('Insert or update result categories for the assay').raw(
        'INSERT INTO ResultCategoryAssay set ? ON DUPLICATE KEY UPDATE ?',
        [
          {
            assayId,
            resultCategoryId,
          },
          {
            assayId,
            resultCategoryId,
          },
        ]
      )
    })
  )
}

module.exports = {
  commonUpserts,
  upsertGxAlertDevice,
  upsertJobFunctionPermission,
  upsertJobFeatures,
  upsertGeneXpertDeviceTypeAndAssays,
  upsertStatesAndLgas,
  upsertAssayResultCategories,
}
