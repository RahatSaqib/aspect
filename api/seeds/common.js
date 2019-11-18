const _ = require('lodash')
const Promise = require('bluebird')

const utils = require('./utils')
const { query } = require('../src/db')

const gxResultDataSchema = require('./fixtures/geneXpertDevice/geneXpertResultDataSchema.json')
const gxPatientDataSchema = require('./fixtures/geneXpertDevice/geneXpertPatientDataSchema.json')
const geneXpertResultDataSchemaHiv = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHiv.json')
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
      'id',
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
    permissionId => ({
      jobFunctionId,
      permissionId,
    })
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
    featureId => ({
      jobFunctionId,
      featureId,
    })
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
  overridePatientDataSchema,
  overrideResultDataSchema
) {
  let geneXpertPatientDataSchema
  if (overridePatientDataSchema)
    geneXpertPatientDataSchema = overridePatientDataSchema
  else geneXpertPatientDataSchema = gxPatientDataSchema

  let geneXpertResultDataSchema
  if (overrideResultDataSchema)
    geneXpertResultDataSchema = overrideResultDataSchema
  else geneXpertResultDataSchema = gxResultDataSchema

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
    'HBV VL': assayTypeHbvVlId,
    HCV: assayTypeHcvId,
    Unknown: assayTypeUnknownId,
  } = await allAssayTypeToId()

  if (_.includes(assayExternalIds, 'GxUnknown')) {
    await createAssay(
      knex,
      'GeneXpert Unknown',
      'assayGeneXpertUnknown',
      'GxUnknown',
      assayTypeUnknownId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX UK',
      geneXpertPatientDataSchema
    )
  }
  if (_.includes(assayExternalIds, 'GxHcv')) {
    await createAssay(
      knex,
      'GeneXpert HCV',
      'assayGeneXpertHcv',
      'GxHcv',
      assayTypeHcvId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX HCV',
      geneXpertPatientDataSchema,
      geneXpertResultDataSchemaHcv,
      ['Detected', 'Invalid', 'NoResult', 'Error'],
      'HCV',
      'resultCategoryHcv',
      null,
      null
    )
  }
  if (_.includes(assayExternalIds, 'GxMtbRif')) {
    await createAssay(
      knex,
      'GeneXpert MTB/Rif',
      'assayGeneXpertMtbRif',
      'GxMtbRif',
      assayTypeMTBRifId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX MTB/Rif',
      geneXpertPatientDataSchema,
      geneXpertResultDataSchema,
      [
        'Detected',
        'NotDetected',
        'Indeterminate',
        'Invalid',
        'NoResult',
        'Error',
      ],
      'MTB',
      'resultCategoryMtb',
      'Rif',
      'resultCategoryRif'
    )
  }
  if (_.includes(assayExternalIds, 'GxMtbRifUltra')) {
    await createAssay(
      knex,
      'GeneXpert MTB/Rif Ultra',
      'assayGeneXpertMtbRifUltra',
      'GxMtbRifUltra',
      assayTypeMTBRifId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX MTB/ULTRA',
      geneXpertPatientDataSchema,
      geneXpertResultDataSchema,
      [
        'Detected',
        'Trace Detected',
        'NotDetected',
        'Indeterminate',
        'Invalid',
        'NoResult',
        'Error',
      ],
      'MTB',
      'resultCategoryMtb',
      'Rif',
      'resultCategoryRif'
    )
  }
  if (_.includes(assayExternalIds, 'GxHiv1Vl')) {
    await createAssay(
      knex,
      'GeneXpert HIV-1 VL',
      'assayGeneXpertHiv1Vl',
      'GxHiv1Vl',
      assayTypeHivVlId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX HIV VL',
      geneXpertPatientDataSchema,
      geneXpertResultDataSchemaHiv,
      [
        'LessThan1000',
        'MoreThan1000',
        'NotDetected',
        'Invalid',
        'NoResult',
        'Error',
      ],
      'HIV',
      'resultCategoryHiv'
    )
  }
  if (_.includes(assayExternalIds, 'GxHiv1Qual')) {
    await createAssay(
      knex,
      'GeneXpert HIV-1 Qual',
      'assayGeneXpertHiv1Qual',
      'GxHiv1Qual',
      assayTypeHivQualId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX HIV Qual',
      geneXpertPatientDataSchema,
      geneXpertResultDataSchemaHiv,
      ['Detected', 'NotDetected', 'Invalid', 'NoResult', 'Error'],
      'HIV',
      'resultCategoryHiv'
    )
  }
  if (_.includes(assayExternalIds, 'GxEbola')) {
    await createAssay(
      knex,
      'GeneXpert Ebola',
      'assayGeneXpertEbola',
      'GxEbola',
      assayTypeEbolaId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX Ebola',
      geneXpertPatientDataSchema,
      geneXpertResultDataSchema,
      ['Detected', 'NotDetected', 'Invalid', 'NoResult', 'Error'],
      'GP',
      'resultCategoryEbolaGp'
    )
  }

  await utils.updateAssayResultCategoryTreatmentEmphasize(knex)
}

async function createAssay(
  knex,
  name,
  i18nKey,
  externalId,
  assayTypeId,
  deviceTypeId,
  resultSourceId,
  abbreviation,
  patientDataSchema,
  resultDataSchema,
  categories,
  resultCategory1Label,
  resultCategory1i18nKey,
  resultCategory2Label,
  resultCategory2i18nKey
) {
  const assay = {
    name,
    i18nKey,
    externalId,
    assayTypeId,
    deviceTypeId,
    resultSourceId,
    resultCategory1Label,
    resultCategory1i18nKey,
    resultCategory2Label,
    resultCategory2i18nKey,
    resultDataSchema: JSON.stringify(resultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
    abbreviation,
  }
  const assayId = await upsertAssay(knex, assay)
  if (categories && categories.length > 0)
    await upsertAssayResultCategories(knex, assayId, categories)
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
      const stateData = _.pick(state, ['id', 'abbreviation', 'name'])
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
          const lgaData = _.pick(lga, ['id', 'name'])

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
  upsertJobFunction,
}
