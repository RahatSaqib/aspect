const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')

const { subMonths } = require('date-fns')
const utils = require('./utils')
const config = require('../src/config')
const { query } = require('../src/db')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

const { insertSite } = require('../src/site/common/db')
const permissionsFixture = require('./fixtures/PermissionsDefinition.json')
const jobFunctionsFixtureDefault = require('./fixtures/jobFunctions')
const followUpFixture = require('./fixtures/FollowUp.json')
const timezone = require('./fixtures/TimeZone.json')
const upsertResultCategoryGroup = require('./common/upsert_result_category_group')
const defaultJobFunctionsFixture = require('./fixtures/jobFunctions')
const resultCategoryGroups = require('./fixtures/resultCategoryGroupBase')
const gxPatientDataSchema = require('./fixtures/geneXpertDevice/geneXpertPatientDataSchema.json')
const geneXpertResultDataSchemaMTBRif = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaMTBRif.json')
const geneXpertResultDataSchemaMTBXdr = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaMTBXdr.json')
const geneXpertResultDataSchemaMTBRifUltra = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaMTBRifUltra.json')
const geneXpertResultDataSchemaHivVl = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHivVl.json')
const geneXpertResultDataSchemaHivQual = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHivQual.json')
const geneXpertResultDataSchemaHcv = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaHcv.json')
const geneXpertResultDataSchemaEbola = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaEbola.json')
const geneXpertResultDataSchemaSarsCoV2 = require('./fixtures/geneXpertDevice/geneXpertResultDataSchemaSarsCoV2.json')
const resultTreatmentStatuses = require('./fixtures/ResultTreatmentStatus.json')
const defaultDashboardWidgetsFixture = require('./fixtures/dashboardWidgetsCommon')
const upsertPartnerData = require('./common/upsert_partner_data')
const {
  deviceApprovalToId,
  deviceTypeToId,
  allDeviceTypeCategoryToId,
  allAssayTypeToId,
  allResultSourceToId,
  resultCategoryToId,
  partnerTypeToId,
  siteTypeToId,
} = require('../src/shared/dictionary')
const upsertConsumables = require('./common/upsert_consumables')

async function upsertGeography(knex, geography) {
  const countries = {}
  await Promise.each(geography.countries, async country => {
    const countryData = _.pick(country, [
      'id',
      'abbreviation',
      'name',
      'a3',
      'culture',
      'countryCode',
      'timezone',
      'exportColumns',
      'inventoryDaysThreshold',
      'monthStartsOnDay',
    ])
    let { countryId, countryGeographyId } =
      (await knex('Country as c')
        .leftJoin('Geography as g', 'c.id', 'g.countryId')
        .where('c.abbreviation', country.abbreviation)
        .whereNull('g.stateId')
        .whereNull('g.lgaId')
        .first('c.id as countryId', 'g.id as countryGeographyId')) || {}

    if (!countryId) {
      ;[countryId] = await knex('Country').insert(countryData)
    } else {
      await knex('Country').where('id', countryId).update(countryData)
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

  return countries
}

/**
 *
 * @param {*} knex Knex object
 * @param {*} partnerId The ID of the partner that will get the upsers applied
 * @param {*} adminId The ID of the admin user
 * @param {*} geography The geography definitions
 * @param {*} countryAbbreviation The country's two letters code
 * @param {*} deviceApiToken The API token for GxAlert device
 * @param {*} usersInsertConfig If it's not null, function will insert one user for each existing job function. This configuration object includes the props: password (string) | excludedJobFunctions (array of external ids). Ex.: { password: "12345", excludedJobFunctions: [ "admin" ] }
 */
async function commonUpserts(
  knex,
  partnerId,
  adminId,
  geography,
  countryAbbreviation,
  usersInsertConfig = null,
  partnerData = {}
) {
  const now = new Date()
  utils.hasSeededStaticData = true
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const countries = await upsertGeography(knex, geography)

  const { culture, timezone, id: countryId, geographyId } = countries[countryAbbreviation]

  let { id: adminPersonId } =
    (await knex('Person')
      .where({
        userId: adminId,
        // geographyId,
        // canLogIn: true,
      })
      .first('id')) || {}
  if (!adminPersonId) {
    ;[adminPersonId] = await knex('Person').insert({
      userId: adminId,
      name: 'Aspect Admin',
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      geographyId,
      culture,
      canLogIn: true,
      timezone,
      ...auditFields,
    })
  }

  const { fixtures = {} } = partnerData
  // upsertJobFunctionFixture by using the job functions set at
  await upsertJobFunctionFixture(knex, _.get(fixtures, 'jobFunctions') || defaultJobFunctionsFixture, partnerId)

  const { id: jobFunctionIdSuperAdmin } = await knex('JobFunction')
    .where({ externalId: 'superAdmin', partnerId })
    .first()
  await utils.upsertSingle(knex, 'JobContext', {
    personId: adminPersonId,
    jobFunctionId: jobFunctionIdSuperAdmin,
    geographyId,
  })

  await ensureResultTreatmentStatuses(knex)

  if (usersInsertConfig)
    await upsertDemoUsersPerJobFunction(
      knex,
      partnerId,
      countryId,
      geographyId,
      culture,
      timezone,
      auditFields,
      usersInsertConfig
    )
}

async function upsertDemoUsersPerJobFunction(
  knex,
  partnerId,
  countryId,
  geographyId,
  culture,
  timezone,
  auditFields,
  { password, excludedJobFunctions }
) {
  if (!password) throw new Error('You must provide a password for upserting users')

  if (!excludedJobFunctions) excludedJobFunctions = []

  const commonUserFields = {
    password: bcrypt.hashSync(password, saltRounds),
    approved: 1,
    lockedOut: 0,
    failedPasswordAttempts: 0,
    createdOn: auditFields.createdOn,
  }
  const commonPersonFields = {
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    canLogIn: true,
    timezone,
    ...auditFields,
  }

  const jobFunctions = await knex('JobFunction')
    .whereNotIn('externalId', [...excludedJobFunctions, 'superAdmin'])
    .andWhere({
      partnerId,
    })

  const insertUsers = jobFunctions.map(async jf => {
    const { id: jobFunctionId, name: jobFunctionName } = jf
    const userName = jobFunctionName.toLowerCase().replace(' ', '-')
    const user = await knex('User').where({ name: userName }).first()
    let userId = user?.id
    if (!userId) {
      ;[userId] = await knex('User').insert({
        name: userName,
        ...commonUserFields,
      })
    }
    const person = await knex('Person').where({ userId }).first()
    let personId = person?.id
    if (!personId) {
      ;[personId] = await knex('Person').insert({
        name: userName,
        userId,
        ...commonPersonFields,
      })
    }
    await utils.upsertSingle(knex, 'JobContext', { personId, jobFunctionId, geographyId })
  })
  await Promise.all(insertUsers)
}

async function upsertJobFunction(knex, jobFunctionName, partnerId, permissions = [], options = {}) {
  const { reports = [], removeMissingPermissions = false } = options

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
      externalId: _.camelCase(jobFunctionName),
      partnerId,
    })
  }
  if (!_.isEmpty(reports)) await upsertJobFunctionReport(knex, jobFunctionId, reports)
  if (!_.isEmpty(permissions))
    await upsertJobFunctionPermission(knex, jobFunctionId, _.uniq(permissions), removeMissingPermissions)
  return jobFunctionId
}

async function clonePermissions(knex, fromModule, toModule) {
  const jobFunctionWithExistingPermission = await knex('JobFunctionPermission as jf')
    .join('Permission as p', 'p.id', 'jf.permissionId')
    .where('p.module', toModule)
    .pluck('jf.jobFunctionId')
  await knex.transaction(async function (trx) {
    await knex
      .from('JobFunctionPermission')
      .transacting(trx)
      .insert(function () {
        this.from('JobFunction as jf')
          .innerJoin('JobFunctionPermission as jfp', 'jf.id', 'jfp.jobFunctionId')
          .innerJoin('Permission as p', 'jfp.permissionId', 'p.id')
          .innerJoin('Permission as pCase', function () {
            this.on('pCase.module', knex.raw('?', [toModule])).on('p.activity', 'pCase.activity')
          })
          .whereNotIn('jf.id', jobFunctionWithExistingPermission)
          .where('p.module', knex.raw('?', [fromModule]))
          .select('jf.id as jobFunctionId', 'pCase.id as permissionId')
      })
  })
}

async function copyPermissionsAndDashboardWidgetsFromJobFunction(
  knex,
  externalIdFrom,
  externalIdTo,
  modulesToExclude = []
) {
  const { id: jobFunctionIdFrom } = await knex('JobFunction').where({ externalId: externalIdFrom }).first('id')

  const { id: jobFunctionIdTo } = await knex('JobFunction').where({ externalId: externalIdTo }).first('id')

  await copyPermissionsFromJobFunction(knex, jobFunctionIdFrom, jobFunctionIdTo, modulesToExclude)

  await copyDashboardWidgetsFromJobFunction(knex, jobFunctionIdFrom, jobFunctionIdTo)
}

async function copyPermissionsFromJobFunction(knex, jobFunctionIdFrom, jobFunctionIdTo, modulesToExclude = []) {
  await knex('JobFunctionPermission').where({ jobFunctionId: jobFunctionIdTo }).del()

  const permissions = _.map(
    await knex('JobFunctionPermission as jfp')
      .join('Permission as p', 'jfp.permissionId', 'p.id')
      .where('jfp.jobFunctionId', jobFunctionIdFrom)
      .whereNotIn('p.module', modulesToExclude)
      .select('permissionId'),
    permission => ({
      jobFunctionId: jobFunctionIdTo,
      permissionId: permission.permissionId,
    })
  )

  await knex('JobFunctionPermission').insert(permissions)
}

async function copyDashboardWidgetsFromJobFunction(knex, jobFunctionIdFrom, jobFunctionIdTo) {
  await knex('JobFunctionDashboardWidget').where({ jobFunctionId: jobFunctionIdTo }).del()

  const permissions = _.map(
    await knex('JobFunctionDashboardWidget as jfd')
      .join('DashboardWidget as w', 'jfd.widgetId', 'w.id')
      .where('jfd.jobFunctionId', jobFunctionIdFrom)
      .select('widgetId'),
    widget => ({
      jobFunctionId: jobFunctionIdTo,
      widgetId: widget.widgetId,
    })
  )

  await knex('JobFunctionDashboardWidget').insert(permissions)
}

async function upsertJobFunctionReport(knex, jobFunctionId, reports) {
  if (_.isEmpty(reports)) throw new Error('Attemp to insert empty reports')
  const reportsIds = await knex('Report').whereIn('externalId', reports).pluck('id')

  const existingJobFunctionReports = await knex('JobFunctionReport').where({ jobFunctionId }).pluck('reportId')

  await knex('JobFunctionReport').where({ jobFunctionId }).whereNotIn('reportId', reportsIds).delete()

  const JobFunctionReport = _.map(
    reportsIds.filter(reportId => !existingJobFunctionReports.includes(reportId)),
    reportId => ({
      jobFunctionId,
      reportId,
    })
  )
  if (!_.isEmpty(JobFunctionReport)) await knex('JobFunctionReport').insert(JobFunctionReport)
}

async function upsertJobFunctionPermission(knex, jobFunctionId, jobPermissions, removeMissing = false) {
  if (_.isEmpty(jobPermissions)) throw new Error('Attemp to upsert empty permissions')
  const existingJobFunctionPermissions = await knex('JobFunctionPermission')
    .where({ jobFunctionId })
    .pluck('permissionId')

  if (removeMissing) {
    await knex('JobFunctionPermission').where({ jobFunctionId }).whereNotIn('permissionId', jobPermissions).delete()
  }

  const JobFunctionPermission = _.map(
    jobPermissions.filter(permissionId => !existingJobFunctionPermissions.includes(permissionId)),
    permissionId => ({
      jobFunctionId,
      permissionId,
    })
  )
  if (!_.isEmpty(JobFunctionPermission)) await knex('JobFunctionPermission').insert(JobFunctionPermission)
}

async function upsertGeneXpertDeviceTypeAndAssays(
  knex,
  assayExternalIds,
  overridePatientDataSchema,
  overrideResultDataSchema,
  partnerData = {}
) {
  const { consumableStrategies } = partnerData
  let geneXpertPatientDataSchema
  if (overridePatientDataSchema) geneXpertPatientDataSchema = overridePatientDataSchema
  else geneXpertPatientDataSchema = gxPatientDataSchema

  // Add device types
  const { Lab: deviceTypeCategoryLab } = await allDeviceTypeCategoryToId()

  let { id: deviceTypeGeneXpertId } = (await knex('DeviceType').where('externalId', 'CepheidGeneXpert').first()) || {}
  if (!deviceTypeGeneXpertId) {
    ;[deviceTypeGeneXpertId] = await knex('DeviceType').insert({
      externalId: 'CepheidGeneXpert',
      name: 'GeneXpert',
      manufacturer: 'Cepheid',
      plugin: 'gxconnect',
      deviceTypeCategoryId: deviceTypeCategoryLab,
    })
  }

  // Add assays
  const { DiagnosticDevice: resultSourceDiagnosticId } = await allResultSourceToId()

  const {
    'MTB/Rif': assayTypeMTBRifId,
    'MTB/XDR': assayTypeMtbXdrId,
    Ebola: assayTypeEbolaId,
    'HIV VL': assayTypeHivVlId,
    'HIV Qual': assayTypeHivQualId,
    HCV: assayTypeHcvId,
    'COVID-19 Test': assayTypeCovid19Id,
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
      overrideResultDataSchema || geneXpertResultDataSchemaHcv,
      ['Detected', 'Invalid', 'NoResult', 'Error', 'NotDetected'],
      'HCV',
      'resultCategoryHcv',
      null,
      null
    )
    await upsertConsumables(knex, true, ['GxHcv'], consumableStrategies)
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
      overrideResultDataSchema || geneXpertResultDataSchemaMTBRif,
      ['Detected', 'NotDetected', 'Indeterminate', 'Invalid', 'NoResult', 'Error'],
      'MTB',
      'resultCategoryMtb',
      'Rif',
      'resultCategoryRif'
    )
    await upsertConsumables(knex, true, ['GxMtbRif'], consumableStrategies)
  }
  if (_.includes(assayExternalIds, 'GxMtbXdr')) {
    await createAssay(
      knex,
      'GeneXpert MTB/XDR',
      'assayGeneXpertMtbXdr',
      'GxMtbXdr',
      assayTypeMtbXdrId,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'XDR',
      geneXpertPatientDataSchema,
      overrideResultDataSchema || geneXpertResultDataSchemaMTBXdr,
      ['Detected', 'NotDetected', 'Indeterminate', 'Invalid', 'NoResult', 'Error'],
      'MTB',
      'resultCategoryMtb',
      'Drug Resistance',
      'resultCategoryDrugResistance'
    )
    await upsertConsumables(knex, true, ['GxMtbXdr'], consumableStrategies)
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
      overrideResultDataSchema || geneXpertResultDataSchemaMTBRifUltra,
      ['Detected', 'Trace Detected', 'NotDetected', 'Indeterminate', 'Invalid', 'NoResult', 'Error'],
      'MTB',
      'resultCategoryMtb',
      'Rif',
      'resultCategoryRif'
    )
    await upsertConsumables(knex, true, ['GxMtbRifUltra'], consumableStrategies)
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
      overrideResultDataSchema || geneXpertResultDataSchemaHivVl,
      ['LessThan1000', 'MoreThan1000', 'NotDetected', 'Invalid', 'NoResult', 'Error', 'LessThan40'],
      'HIV',
      'resultCategoryHiv'
    )
    await upsertConsumables(knex, true, ['GxHiv1Vl'], consumableStrategies)
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
      overrideResultDataSchema || geneXpertResultDataSchemaHivQual,
      ['Detected', 'NotDetected', 'Invalid', 'NoResult', 'Error'],
      'HIV',
      'resultCategoryHiv'
    )
    await upsertConsumables(knex, true, ['GxHiv1Qual'], consumableStrategies)
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
      overrideResultDataSchema || geneXpertResultDataSchemaEbola,
      ['Detected', 'NotDetected', 'Invalid', 'NoResult', 'Error'],
      'GP',
      'resultCategoryEbolaGp'
    )
    await upsertConsumables(knex, true, ['GxEbola'], consumableStrategies)
  }
  if (_.includes(assayExternalIds, 'assayGXCovid19')) {
    await createAssay(
      knex,
      'GeneXpert COVID-19',
      'assayGXCovid19',
      'assayGXCovid19',
      assayTypeCovid19Id,
      deviceTypeGeneXpertId,
      resultSourceDiagnosticId,
      'GX COVID-19',
      geneXpertPatientDataSchema,
      overrideResultDataSchema || geneXpertResultDataSchemaSarsCoV2,
      ['Positive', 'Negative', 'Inconclusive', 'Unknown', 'Invalid', 'NoResult', 'Error', 'PresumptivePositive'],
      'COVID-19',
      'resultCategoryCovid19'
    )
    await upsertConsumables(knex, true, ['assayGXCovid19'], consumableStrategies)
  }

  await utils.updateAssayResultCategoryTreatmentEmphasize(knex)

  await utils.seedPartnerAssay(knex)
  await utils.seedPartnerDisease(knex)
  await utils.upsertFollowUps(knex, followUpFixture, null, assayExternalIds)

  const existingAssayExternalIds = await knex('Assay').whereIn('externalId', assayExternalIds).pluck('externalId')
  await upsertResultCategoryGroup(knex, resultCategoryGroups, existingAssayExternalIds)
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
  if (categories && categories.length > 0) await upsertAssayResultCategories(knex, assayId, categories)
}

async function upsertAssay(knex, assay) {
  let { id: assayId } = (await knex('Assay').where({ externalId: assay.externalId }).first('id')) || {}
  if (!assayId) {
    ;[assayId] = await knex('Assay').insert(assay)
  } else {
    await knex('Assay').where('id', assayId).update(assay)
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
          .andWhere(function () {
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
// safe to execute multiple times - will only add new entries
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

const defaultGxAlertMigrationVariables = {
  admin: {
    name: 'admin',
    password: null, // required
  },
  partner: {
    name: null, // required
    serverUrl: null, // required
  },
  geographyFromGxAlert: {
    countries: null, // required
    /* -- Query Country With States & LGAs in GxAlert
SELECT CONCAT(
  '{"abbreviation":"', country.Abbreviation,
  '","name":"', country.Name,
  '","a3":"', country.A3,
  '","culture":"', country.Culture,
  '","countryCode":"', Country.CountryCode,
  '","timezone":"', Country.TimeZoneId,
  '","portNumber":', Country.PortNumber,
  ',"exportColumns":"', Country.ExportColumns,
  '","inventoryDaysThreshold":', Country.InventoryDaysThreshold,
  ',"monthStartsOnDay":', IFNULL(Country.MonthStartsOnDay, '1'),
  ',"states":[') AS countryJSON
FROM Country
WHERE Country.Name IS NOT NULL
AND Country.A3 IS NOT NULL
UNION
SELECT CONCAT(
    '{"name":"', State.Name, '",',
    IFNULL(CONCAT('"abbreviation":"', State.Abbreviation, '",'), ''),
    '"lgas":[', IFNULL((SELECT GROUP_CONCAT(CONCAT('{"name":"', Lga.Name, '"}')) FROM Lga WHERE Lga.Name IS NOT NULL AND Lga.StateId = State.StateId), ''), ']',
    '},') AS countryJSON
FROM Country
JOIN State ON State.CountryId = Country.CountryId
WHERE Country.Name IS NOT NULL
AND Country.A3 IS NOT NULL
UNION
SELECT ']}' AS countryJSON;
*/
  },
  gxAlertDevice: {
    deviceApiKeyToken: null, // required
  },
  sitesFromGxAlert: [],
  jobFunctions: [],
  contactsFromGxAlert: [],
  /* -- Query Contacts in GxAlert
  TODO: These queries belong is a more comprehensive document that explains how to migrate a customer from GxAlert to Aspect
        https://ops.systemone.id/browse/ASP-1373
SELECT CONCAT(
'{ "personName": "',  person.Name,
COALESCE(CONCAT('", "personTitle": "', person.Title), ''),
'", "jobFunctions": [ "', CASE WHEN role.Name = 'National Level' THEN 'Super Admin' WHEN role.Name IN ('State Level', 'LGA Level') THEN 'Regional Officer' WHEN role.Name = 'Lab Level' THEN 'Lab User' ELSE '' END,
'" ], ', COALESCE(CONCAT('"personEmailAddress": "', person.Email, '", '), ''),
COALESCE(CONCAT('"personPhone": "', person.Phone, '", '), ''),
COALESCE(CONCAT('"personCell": "', person.Cell, '", '), ''),
COALESCE(CONCAT('"username": "', my_aspnet_users.name, '", '), ''),
COALESCE(CONCAT('"timezone": "', person.TimeZoneId, '", '), ''),
'"hidePatientId": ', COALESCE(CASE WHEN person.HidePatientId = 1 THEN 'true' END, 'false'),
', "hideSampleId": ', COALESCE(CASE WHEN person.HideSampleId = 1 THEN 'true' END, 'false'),
', "hideNotes": ', COALESCE(CASE WHEN person.HideNotes = 1 THEN 'true' END, 'false'),
', "getPasswordFromGxAlert": true',
COALESCE(CONCAT(', "geographies": [ ', CASE WHEN role.Name = 'National Level' THEN '{}'
                                          WHEN role.Name = 'State Level' THEN GROUP_CONCAT(DISTINCT CONCAT('{ "stateName": "', personstate_state.Name, '" }'))
                                          WHEN role.Name = 'LGA Level' THEN GROUP_CONCAT(DISTINCT CONCAT('{ "stateName": "', personlgastate_state.Name, '", "lgaName": "', personlga_lga.Name, '" }'))
                                     END, ' ]'), ''),
COALESCE(CONCAT(', "sites": [ ', CASE WHEN role.Name = 'Lab Level' THEN GROUP_CONCAT(DISTINCT CONCAT('{ "shortName": "', persondeployment_deployment.ShortName, '" }')) END, ' ], '), ''),
'},') AS jsonObject
FROM person
LEFT JOIN my_aspnet_users ON my_aspnet_users.id = person.UserId
LEFT JOIN state ON state.StateId = person.StateId
LEFT JOIN lga ON lga.LgaId = person.LgaId
LEFT JOIN deployment ON deployment.DeploymentId = person.DeploymentId
LEFT JOIN role ON role.RoleId = person.RoleId
LEFT JOIN persondeployment ON persondeployment.PersonId = person.PersonId
LEFT JOIN deployment as persondeployment_deployment ON persondeployment_deployment.DeploymentId = persondeployment.DeploymentId
LEFT JOIN personlga ON personlga.PersonId = person.PersonId
LEFT JOIN lga as personlga_lga ON personlga_lga.LgaId = personlga.LgaId
LEFT JOIN state as personlgastate_state ON personlgastate_state.StateId = personlga_lga.StateId
LEFT JOIN personstate ON personstate.PersonId = person.PersonId
LEFT JOIN state as personstate_state ON personstate_state.StateId = personstate.StateId
GROUP BY person.PersonId
*/
  geneXpertAssayExternalIds: [
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
    'GxUnknown',
    'GxHcv',
    'assayGXCovid19',
  ],
  customFieldsFromGxAlert: [],
}

async function getStatesByName(knex, countryId) {
  const states = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
    .select('g.countryId', 's.id', 's.name')
  const lgas = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  return states.reduce((stateMemo, state) => {
    stateMemo[state.name.toLowerCase()] = state
    const stateLgas = _.filter(lgas, {
      stateName: state.name,
    })
    if (stateLgas) {
      stateMemo[state.name.toLowerCase()].lgas = stateLgas.reduce((lgaMemo, lga) => {
        lgaMemo[lga.name.toLowerCase()] = lga
        return lgaMemo
      }, {})
    }
    return stateMemo
  }, {})
}

async function baseGxAlertMigration(variables = defaultGxAlertMigrationVariables, knex, partnerData = {}) {
  // -----------------------------------------------
  // Supplement passed variables with default values
  // -----------------------------------------------
  const variablesWithDefaults = _.merge({ ...defaultGxAlertMigrationVariables }, variables)
  const {
    admin,
    partner,
    geographyFromGxAlert,
    gxAlertDevice,
    sitesFromGxAlert,
    jobFunctionsFixture = defaultJobFunctionsFixture,
    contactsFromGxAlert,
    geneXpertAssayExternalIds,
    customFieldsFromGxAlert,
  } = variablesWithDefaults
  const gxAlertAdmin = contactsFromGxAlert.find(contact => contact.username === admin.name) || {}
  if (gxAlertAdmin.getPasswordFromGxAlert) {
    admin.legacyPassword = 1
  }
  const { countries } = geographyFromGxAlert

  // -------------------------
  // Validate passed variables
  // -------------------------
  const missingVariables = []
  let { id: adminId } = (await knex('User').where('name', admin.name).first('id')) || {}
  if (!admin.password && !gxAlertAdmin.getPasswordFromGxAlert && !adminId) {
    const adminPasswordInFixture = (contactsFromGxAlert.find(c => c.username === admin.name) || {}).password
    if (adminPasswordInFixture) {
      admin.password = adminPasswordInFixture
    } else {
      missingVariables.push('admin.password')
    }
  }
  if (!partner.name) {
    missingVariables.push('partner.name')
  }
  if (!partner.serverUrl) {
    missingVariables.push('partner.serverUrl')
  }
  if (_.isEmpty(countries)) {
    missingVariables.push('geography.countries')
  } else {
    countries.forEach((country, index) => {
      if (!country.abbreviation) {
        missingVariables.push(`geography.countries[${index}].abbreviation`)
      }
      if (!country.name) {
        missingVariables.push(`geography.countries[${index}].name`)
      }
      if (!country.a3) {
        missingVariables.push(`geography.countries[${index}].a3`)
      }
      if (!country.countryCode) {
        missingVariables.push(`geography.countries[${index}].countryCode`)
      }
      if (!country.timezone) {
        missingVariables.push(`geography.countries[${index}].timezone`)
      }
    })
  }
  if (!gxAlertDevice.deviceApiKeyToken) {
    missingVariables.push('gxAlertDevice.deviceApiKeyToken')
  }
  if (!_.isEmpty(missingVariables)) {
    throw new Error(`The following required variables were not passed: ${missingVariables.join(',')}`)
  }

  // ---------------------------
  // Seed admin user and partner
  // ---------------------------
  const now = new Date()
  if (!adminId) {
    ;[adminId] = await knex('User').insert({
      approved: 1,
      createdOn: now,
      lockedOut: 0,
      failedPasswordAttempts: 0,
      ...admin,
      password: bcrypt.hashSync(admin.password || '', saltRounds),
    })
  }

  const partnerId = await upsertPartnerData(knex, {
    ...partnerData,
    partnerTypeId: await partnerTypeToId('operating'),
  })
  const returnValue = {
    adminId,
    partnerId,
  }
  // --------------------
  // Common general seeds
  // --------------------
  await commonUpserts(knex, partnerId, adminId, geographyFromGxAlert, countries[0].abbreviation, null, partnerData)

  // --------------------------------------------
  // Country, States & LGAs from GxAlert instance
  // --------------------------------------------
  const country = await knex('Country as c')
    .where('c.abbreviation', countries[0].abbreviation)
    .first('c.id', 'c.culture', 'c.timezone')
  const countryGeography = await knex('Geography')
    .where('countryId', country.id)
    .whereNull('stateId')
    .whereNull('lgaId')
    .first('id')
  const { id: countryId } = country
  returnValue.countryId = countryId
  const statesByName = await getStatesByName(knex, countryId)
  returnValue.statesByName = statesByName

  // --------------------------------------------------------------------------------
  // GeneXpert Assays with Patient and Result Data Schemas from GxAlert Custom Fields
  // --------------------------------------------------------------------------------
  const patientDbColumns = [
    'HivStatus',
    'DrSuspect',
    'PatientAge',
    'PatientGender',
    'PatientCity',
    'HealthFacility',
    'PreviouslyTreated',
    'PatientName',
    'PatientAddress',
    'PatientState',
    'PatientLga',
    'PatientPhone',
    'PatientId',
    'PatientAgeMonths',
  ]
  const patientDataCustomFields = _.sortBy(
    _.uniqBy(
      customFieldsFromGxAlert
        .filter(cf => patientDbColumns.includes(cf.dbColumn))
        .map(cf => _.pick(cf, ['title', 'order', 'type', 'dbColumn'])),
      'dbColumn'
    ),
    'order'
  )
  const patientDataSchema = patientDataCustomFields.length > 0 ? {} : undefined
  patientDataCustomFields.forEach(cf => {
    patientDataSchema[_.camelCase(cf.dbColumn)] = {
      title: cf.title,
      type: cf.type === 'DateTime' ? 'date' : cf.type.toLowerCase(),
      order: cf.order,
    }
  })

  await upsertGeneXpertDeviceTypeAndAssays(knex, geneXpertAssayExternalIds, patientDataSchema, null, partnerData)
  returnValue.patientDataSchema = patientDataSchema
  const gxAlertAssayDataMappings = {
    GxMtbRif: 'GeneXpert TB/RIF Result',
    GxMtbRifUltra: 'GeneXpert MTB-RIF Ultra',
    GxMtbXdr: 'GeneXpert MTB/XDR',
    GxHiv1Vl: 'GeneXpert HIV-1 Viral Load Result',
    GxHiv1Qual: 'GeneXpert HIV-1 QUAL Result',
    GxEbola: 'GeneXpert Ebola Result',
    GxHcv: 'GeneXpert HCV Viral Load',
    assayGXCovid19: 'GeneXpert SARS-CoV-2',
  }
  await Promise.each(geneXpertAssayExternalIds, async geneXpertAssayExternalId => {
    if (!gxAlertAssayDataMappings[geneXpertAssayExternalId] && geneXpertAssayExternalId !== 'GxUnknown') {
      return Promise.resolve()
    }
    const resultDataCustomFieldsForAssay = _.sortBy(
      _.uniqBy(
        customFieldsFromGxAlert
          .filter(
            cf =>
              (geneXpertAssayExternalId === 'GxUnknown' ||
                cf.testType === gxAlertAssayDataMappings[geneXpertAssayExternalId] ||
                cf.testType === null) &&
              !patientDbColumns.includes(cf.dbColumn)
          )
          .map(cf => _.pick(cf, ['title', 'order', 'type', 'dbColumn'])),
        'dbColumn'
      ),
      'order'
    )
    if (resultDataCustomFieldsForAssay.length === 0) {
      return Promise.resolve()
    }
    const existingAssay = await knex('Assay').where('externalId', geneXpertAssayExternalId).first()
    if (existingAssay) {
      const resultDataSchema = JSON.parse(existingAssay.resultDataSchema || '{}')
      if (!resultDataSchema.gxAlertCustomFields) {
        resultDataSchema.gxAlertCustomFields = {
          list: false,
          order: (_.max(Object.values(resultDataSchema).map(val => val.order)) || -1) + 1,
          type: 'object',
          title: 'GxAlert Custom Fields',
          properties: {},
        }
      }
      resultDataCustomFieldsForAssay.forEach(cf => {
        const resultDataSchemaProperty = _.camelCase(cf.dbColumn || cf.title)
        const existingCustomFieldProperty =
          resultDataSchema.gxAlertCustomFields.properties[resultDataSchemaProperty] || {}
        resultDataSchema.gxAlertCustomFields.properties[resultDataSchemaProperty] = {
          ...existingCustomFieldProperty,
          title: cf.title,
          type: cf.type === 'DateTime' ? 'date' : cf.type.toLowerCase(),
          order: cf.order,
        }
      })
      await knex('Assay')
        .where('id', existingAssay.id)
        .update({
          resultDataSchema: JSON.stringify(resultDataSchema),
        })
    }
  })

  // -----------------------------------
  // Seed Sites from GxAlert Deployments
  // -----------------------------------
  upsertSites(knex, adminId, partnerId, country, statesByName, sitesFromGxAlert)

  const siteIds = await knex('Geography as g')
    .join('Site as s', 'g.id', 's.geographyId')
    .where('g.countryId', countryId)
    .select('s.id', 's.shortName')
    .distinct('s.id', 's.shortName')
    .then(items =>
      items.reduce((siteMap, site) => {
        siteMap[site.shortName] = site.id
        return siteMap
      }, {})
    )
  returnValue.siteIds = siteIds

  await upsertJobFunctionFixture(knex, jobFunctionsFixture, partnerId)

  const jobFunctions = await knex('JobFunction')
    .where({ partnerId })
    .select()
    .then(items =>
      items.reduce((jobFunctionMap, jobFunction) => {
        jobFunctionMap[jobFunction.name] = jobFunction.id
        return jobFunctionMap
      }, {})
    )

  // -------------------------------------
  // Contacts & User Accounts from GxAlert (filtering users without jobFunctions)
  // -------------------------------------
  await Promise.each(contactsFromGxAlert, async person => {
    let userId = null
    if (person.username) {
      const existingUser = await knex('User').where('name', person.username).first('id')
      if (existingUser) {
        userId = existingUser.id
      } else if (!_.isEmpty(person.jobFunctions)) {
        const pw = bcrypt.hashSync(person.password || 'WelcomeToAspect', saltRounds)
        const baseUserData = {
          password: pw,
          failedPasswordAttempts: 0,
          legacyPassword: person.getPasswordFromGxAlert ? 1 : 0,
          lockedOut: 0,
        }
        ;[userId] = await knex('User').insert({
          name: person.username,
          approved: 1,
          createdOn: now,
          ...baseUserData,
        })
      }
    }
    const state =
      !_.isEmpty(person.geographies) && person.geographies[0].stateName
        ? statesByName[person.geographies[0].stateName.toLowerCase()] || {
            id: null,
            lgas: {},
          }
        : {
            id: null,
            lgas: {},
          }
    const lga =
      state.lgas && !_.isEmpty(person.geographies) && person.geographies[0].lgaName
        ? state.lgas[person.geographies[0].lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: geographyId } = !_.isEmpty(person.geographies)
      ? await knex('Geography')
          .where({
            countryId,
            stateId: state.id,
            lgaId: lga.id,
          })
          .first()
      : { id: countryGeography.id }
    let personId = null
    const existingPerson = await knex('Person')
      .where('userId', userId || -1)
      .orWhere(function () {
        this.where('name', person.personName)
        if (person.personEmailAddress) {
          this.andWhere('email', person.personEmailAddress)
        }
      })
      .first()
    const personTimeZone =
      _.get(
        _.find(timezone.data, tz => tz.id === person.timezone),
        'id'
      ) || countries[0].timezone
    const canLogIn = !_.isEmpty(person.username)
    if (existingPerson) {
      if (
        existingPerson.name !== person.personName ||
        existingPerson.partnerId !== partnerId ||
        existingPerson.timezone !== personTimeZone ||
        existingPerson.title !== person.title ||
        existingPerson.geographyId !== geographyId ||
        existingPerson.email !== person.personEmailAddress ||
        existingPerson.cell !== person.personCell ||
        existingPerson.phone !== person.personPhone ||
        existingPerson.hidePatientId !== person.hidePatientId ||
        existingPerson.hideSampleId !== person.hideSampleId ||
        existingPerson.hideNotes !== person.hideNotes
      ) {
        await knex('Person')
          .where('id', existingPerson.id)
          .update({
            ...existingPerson,
            name: person.personName,
            partnerId,
            timezone: personTimeZone,
            title: person.title,
            geographyId,
            email: person.personEmailAddress,
            cell: person.personCell,
            phone: person.personPhone,
            hidePatientId: person.hidePatientId,
            hideSampleId: person.hideSampleId,
            hideNotes: person.hideNotes,
            updatedOn: now,
            updatedBy: adminId,
            canLogIn,
            userId: userId || existingPerson.userId,
          })
      }
      personId = existingPerson.id
    } else {
      const auditFields = {
        createdOn: now,
        createdBy: adminId,
        updatedOn: now,
        updatedBy: adminId,
      }

      ;[personId] = await knex('Person').insert({
        name: person.personName,
        partnerId,
        timezone: personTimeZone,
        geographyId,
        title: person.title,
        email: person.personEmailAddress,
        cell: person.personCell,
        phone: person.personPhone,
        userId,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        hidePatientId: person.hidePatientId,
        hideSampleId: person.hideSampleId,
        hideNotes: person.hideNotes,
        culture: 'en-US',
        canLogIn,
        ...auditFields,
      })
    }
    if (!_.isEmpty(person.jobFunctions)) {
      await Promise.each(person.jobFunctions, async jobFunctionName => {
        const jobFunctionId = jobFunctions[jobFunctionName]
        const existingJobContext = await knex('JobContext')
          .where({
            personId,
            jobFunctionId,
          })
          .first()
        if (!existingJobContext) {
          if (
            jobFunctionName === 'Lab User' &&
            person.sites &&
            person.sites.length > 0 &&
            siteIds[person.sites[0].shortName]
          ) {
            await knex('JobContext').insert({
              personId,
              jobFunctionId,
              siteId: siteIds[person.sites[0].shortName],
            })
          } else if (!_.isEmpty(person.geographies)) {
            await Promise.each(person.geographies, async geography => {
              const jobState = geography.stateName
                ? statesByName[geography.stateName.toLowerCase()] || {
                    id: null,
                    lgas: {},
                  }
                : {
                    id: null,
                    lgas: {},
                  }
              const jobLga =
                jobState.lgas && geography.lgaName
                  ? jobState.lgas[geography.lgaName.toLowerCase()] || {
                      id: null,
                    }
                  : {
                      id: null,
                    }
              const { id: jobGeographyId } = await knex('Geography')
                .where({
                  countryId,
                  stateId: jobState.id,
                  lgaId: jobLga.id,
                })
                .first()
              await knex('JobContext').insert({
                personId,
                jobFunctionId,
                geographyId: jobGeographyId,
              })
            })
          }
        }
      })
    }
  })

  return returnValue
}

async function removeJobFunctions(knex, jobFunctionsToDelete) {
  await Promise.each(jobFunctionsToDelete, async ({ id }) => {
    await knex('JobContext').where('jobFunctionId', id).delete()
    await knex('JobFunctionDashboardWidget').where('jobFunctionId', id).delete()
    await knex('JobFunctionPermission').where('jobFunctionId', id).delete()
    await knex('JobFunctionReport').where('jobFunctionId', id).delete()
    await knex('JobFunction').where({ id }).delete()
  })
}

/**
 *
 * Synchronizes the provided fixture with the job functions configuration in the database, removing from the database the ones that aren't in the fixture, inserting the ones that aren't at the database, and updating the ones present in both sides.
 * It makes the same process for updating the permissions and reports assigned to each job function.
 *
 * @param {object} knex
 * @param {Array} jobFunctionFixture
 * @param {number} partnerId
 */
async function upsertJobFunctionFixture(knex, jobFunctionFixture = jobFunctionsFixtureDefault, partnerId) {
  const { getPermissonByModuleAndActivity } = utils

  const externalIds = jobFunctionFixture.map(jf => _.camelCase(jf.name))
  const jobFunctionsToDelete = await knex('JobFunction').where({ partnerId }).whereNotIn('externalId', externalIds)
  await removeJobFunctions(knex, jobFunctionsToDelete, partnerId)

  await Promise.each(jobFunctionFixture, async jf => {
    const jobFunction = _.omit(jf, ['permissions', 'reports'])

    const permissionIds = await Promise.map(jf.permissions || [], async permission => {
      const { id: permissionId } =
        (await getPermissonByModuleAndActivity(knex, permission.module, permission.activity)) || {}

      if (!permissionId)
        throw new Error(
          `Permission ${permission.module}:${permission.activity} doesn't exist and therefore cannot be assigned to a job function.`
        )

      return permissionId
    })

    await upsertJobFunction(knex, jobFunction.name, partnerId, _.uniq(permissionIds), {
      reports: jf.reports,
      removeMissingPermissions: true,
    })
  })
}

async function seedLabClinicFixture(
  labClinics,
  seededData = { adminId: 0, partnerId: 0, countryId: 0, statesByName: {} },
  knex
) {
  const missingSeededData = []
  if (!seededData.adminId) {
    missingSeededData.push('seededData.adminId')
  }
  if (!seededData.partnerId) {
    missingSeededData.push('seededData.partnerId')
  }
  if (!seededData.countryId) {
    missingSeededData.push('seededData.countryId')
  }
  if (!_.isEmpty(missingSeededData)) {
    throw new Error(`The following required seeded values were not passed: ${missingSeededData.join(',')}`)
  }
  const now = new Date()
  const { adminId, partnerId, countryId, statesByName = {} } = seededData
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const approvedDeviceApprovalId = await deviceApprovalToId('approved')
  const clinicSiteTypeId = await siteTypeToId('clinic')

  await Promise.map(labClinics.clinics || [], async clinic => {
    const state = clinic.stateName
      ? statesByName[clinic.stateName.toLowerCase()] || {
          id: null,
          lgas: {},
        }
      : {
          id: null,
          lgas: {},
        }
    const district =
      state.lgas && clinic.lgaName
        ? state.lgas[clinic.lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: clinicGeographyId } = await knex('Geography')
      .where({
        countryId,
        stateId: state.id,
        lgaId: district.id,
      })
      .first()
    const siteData = {
      partnerId,
      geographyId: clinicGeographyId,
      name: clinic.name,
      shortName: clinic.shortName,
      externalId: clinic.externalId,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      siteTypeId: clinicSiteTypeId,
      ...auditFields,
    }
    const existingClinic = await knex('Site as s')
      .join('Geography as g', 's.geographyId', 'g.id')
      .where('g.countryId', countryId)
      .andWhere('s.externalId', clinic.externalId)
      .first('s.*')
    if (existingClinic) {
      await knex('Site')
        .where('id', existingClinic.id)
        .update({
          ...existingClinic,
          ...siteData,
        })
    } else {
      await insertSite(knex, siteData)
    }
  })

  const labSiteTypeId = await siteTypeToId('lab')
  await Promise.map(labClinics.labs || [], async lab => {
    const state = lab.stateName
      ? statesByName[lab.stateName.toLowerCase()] || {
          id: null,
          lgas: {},
        }
      : {
          id: null,
          lgas: {},
        }
    const district =
      state.lgas && lab.lgaName
        ? state.lgas[lab.lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: labGeographyId } = await knex('Geography')
      .where({
        countryId,
        stateId: state.id,
        lgaId: district.id,
      })
      .first()
    const siteData = {
      partnerId,
      geographyId: labGeographyId,
      name: lab.name,
      shortName: lab.shortName,
      externalId: lab.externalId,
      latitude: lab.latitude,
      longitude: lab.longitude,
      siteTypeId: labSiteTypeId,
      ...auditFields,
    }

    const existingLab = await knex('Site as s')
      .join('Geography as g', 's.geographyId', 'g.id')
      .where('g.countryId', countryId)
      .andWhere('s.externalId', lab.externalId)
      .first('s.*')
    let siteId
    if (existingLab) {
      siteId = existingLab.id
      await knex('Site')
        .where('id', existingLab.id)
        .update({
          ...existingLab,
          ...siteData,
        })
    } else {
      ;[siteId] = await insertSite(knex, siteData)
    }
    siteData.id = siteId

    if (lab.devices) {
      await Promise.all(
        _.map(lab.devices, async device => {
          const deviceApiKeyToken = device.deviceApiKey
          const deviceData =
            (await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.deviceId', 'd.id')
              .where('dak.token', deviceApiKeyToken)
              .first('d.*')) || {}
          if (_.isEmpty(deviceData)) {
            const lastDeviceActivity = now
            deviceData.partnerId = partnerId
            deviceData.siteId = siteData.id
            const { id: deviceTypeId } = await knex('DeviceType')
              .where('externalId', device.deviceTypeId || 'CepheidGeneXpert')
              .first('id')
            deviceData.deviceTypeId = deviceTypeId
            deviceData.deviceApprovalId = approvedDeviceApprovalId
            deviceData.name = device.name
            deviceData.shortName = device.shortName
            deviceData.macAddress = device.macAddress
            deviceData.serial = device.deviceSerial
            deviceData.hostId = device.hostId
            deviceData.lastSeenOn = lastDeviceActivity
            deviceData.lastPingOn = lastDeviceActivity
            deviceData.lastPingFromIp = device.lastPingFromIp
            deviceData.putInService = subMonths(now, 2)
            deviceData.putInServiceSource = 'Installed at lab'
            deviceData.configurationData = '{}'
            const [deviceId] = await knex('Device').insert({
              ...deviceData,
              ...auditFields,
            })
            deviceData.id = deviceId
            await knex('DeviceApiKey').insert({
              token: deviceApiKeyToken,
              revoked: 0,
              partnerId,
              geographyId: labGeographyId,
              siteId,
              deviceId,
              ...auditFields,
            })
          }
        })
      )
    }
  })
}

async function ensureResultTreatmentStatuses(knex, treatmentStatuses = resultTreatmentStatuses) {
  await Promise.each(treatmentStatuses, async resultTreatmentStatus => {
    const existingResultTreatmentStatus = await knex('ResultTreatmentStatus')
      .where('externalId', resultTreatmentStatus.externalId)
      .first()
    if (!existingResultTreatmentStatus) {
      await knex('ResultTreatmentStatus').insert(resultTreatmentStatus)
    }
  })
}

async function upsertDashboardWidgets(
  knex,
  partnerId,
  dashboardWidgetJson = defaultDashboardWidgetsFixture,
  whitelist = null
) {
  if (!dashboardWidgetJson) return Promise.resolve()

  let widgets = dashboardWidgetJson.stat

  // Remove widgets that are not in the fixture
  const widgetsToKeepIds = _.map(widgets, w => w.externalId)
  const widgetsToRemove = await knex('DashboardWidget').whereNotIn('externalId', widgetsToKeepIds).pluck('id')
  await knex('JobFunctionDashboardWidget').whereIn('widgetId', widgetsToRemove).del()
  await knex('DashboardWidgetStat').whereIn('dashboardWidgetId', widgetsToRemove).del()
  await knex('DashboardWidgetTarget').whereIn('dashboardWidgetId', widgetsToRemove).del()
  await knex('DashboardWidget').whereIn('id', widgetsToRemove).del()

  // Get widgets to insert/update based on whitelist
  if (whitelist) widgets = _.filter(dashboardWidgetJson.stat, widget => _.indexOf(whitelist, widget.externalId) > -1)

  // Iterate over all whitelisted widgets and insert/update
  await Promise.all(
    _.map(widgets, async widget => {
      // insert or update the widget itself
      const widgetData = _.pick(widget, [
        'title',
        'titleI18nKey',
        'subTitle',
        'subTitleI18nKey',
        'sqlForIndicator',
        'link',
        'linkParams',
        'sortOrder',
        'externalId',
        'description',
        'descriptionI18nKey',
        'dashboards',
        'options',
      ])
      widgetData.dashboards = JSON.stringify(widgetData.dashboards || { home: {} })
      widgetData.linkParams = JSON.stringify(widgetData.linkParams || {})
      widgetData.options = JSON.stringify(widgetData.options || {})

      let { id: widgetId } =
        (await knex('DashboardWidget').where('externalId', widgetData.externalId).first('id')) || {}

      if (!widgetId) {
        ;[widgetId] = await knex('DashboardWidget').insert(widgetData)
      } else {
        await knex('DashboardWidget').update(widgetData).where('id', widgetId)
      }

      // insert or update the stat for the widget
      const statWidgetData = _.pick(widget, [
        'icon',
        'sqlForStatUnit',
        'statUnit',
        'statUnitI18nKey',
        'statStatus',
        'statStatusI18nKey',
        'sqlForExtra',
        'extraUnit',
        'extraUnitI18nKey',
        'extraLabel',
        'extraLabelI18nKey',
      ])

      const { id: widgetStatId } =
        (await knex('DashboardWidgetStat').where('dashboardWidgetId', widgetId).first('id')) || {}

      if (!widgetStatId) {
        await knex('DashboardWidgetStat').insert({
          dashboardWidgetId: widgetId,
          ...statWidgetData,
        })
      } else {
        await knex('DashboardWidgetStat').update(statWidgetData).where('id', widgetStatId)
      }

      // add widget to configured job functions here
      const jobFunctionsDb = await knex('JobFunction')
        .where({ partnerId })
        .where(function () {
          if (widget.jobFunctions && widget.jobFunctions !== 'all' && widget.jobFunctions[0] !== 'all') {
            this.whereIn('externalId', widget.jobFunctions)
          }
        })
        .select('id', 'name')

      await Promise.each(jobFunctionsDb, async jf => {
        const { jobFunctionId } =
          (await knex('JobFunctionDashboardWidget')
            .where('jobFunctionId', jf.id)
            .where({ widgetId })
            .first('jobFunctionId')) || {}

        if (!jobFunctionId) {
          await knex('JobFunctionDashboardWidget').insert({
            jobFunctionId: jf.id,
            widgetId,
          })
        }
      })
    })
  )
}

async function upsertPermissionFixture(knex) {
  const currentPermissions = await knex('Permission').select()

  // Remove deprecated permissions
  await Promise.each(currentPermissions, async ({ module, activity, id }) => {
    const shouldRemovePermission = permissionsFixture.find(p => p.module === module && p.activity === activity) === null
    if (shouldRemovePermission) {
      await knex('JobFunctionPermission').where({ permissionId: id }).delete()
      await knex('Permission').where({ id }).delete()
    }
  })

  // Add or update permissions
  await Promise.each(permissionsFixture, async ({ module, activity, description }) => {
    const currentPermission = currentPermissions.find(up => up.module === module && up.activity === activity)
    if (currentPermission) {
      await knex('Permission').where({ module, activity }).update({ description })
    } else {
      await knex('Permission').insert({ module, activity, description })
    }
  })
}

async function upsertSites(knex, adminId, partnerId, country, statesByName, sitesFromGxAlert) {
  const now = new Date()

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const siteTypes = await knex('SiteType').select('id', 'externalId')

  await Promise.each(sitesFromGxAlert, async site => {
    const state = site.stateName
      ? statesByName[site.stateName.toLowerCase()] || {
          id: null,
          lgas: {},
        }
      : {
          id: null,
          lgas: {},
        }
    const district =
      state.lgas && site.lgaName
        ? state.lgas[site.lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: siteGeographyId } = await knex('Geography')
      .where({
        countryId: country.id,
        stateId: state.id,
        lgaId: district.id,
      })
      .first()

    const siteTypeId = siteTypes.find(st => st.externalId === (site.type || 'lab')).id

    const warehouse = await knex('Site as w')
      .join('SiteType as st', 'w.siteTypeId', 'st.id')
      .where('st.externalId', 'warehouse')
      .where('w.externalId', site.warehouse_externalId || null)
      .first({ warehouseId: 'w.id' })
    const warehouseId = warehouse ? warehouse.warehouseId : null

    const siteData = {
      partnerId,
      geographyId: siteGeographyId,
      siteTypeId,
      name: site.name,
      shortName: site.shortName,
      externalId: site.externalId,
      latitude: site.latitude,
      longitude: site.longitude,
      timezoneId: country.timezone,
      parentWarehouseId: warehouseId || null,
      customProperties: site.customProperties || null,
      ...auditFields,
    }

    const existingSite = await knex('Site').where('externalId', site.externalId).orWhere('name', site.name).first('id')

    let siteId = 0
    if (existingSite) {
      siteId = existingSite.id
      await knex('Site').where('id', siteId).update(siteData)
    } else {
      ;[siteId] = await insertSite(knex, siteData)
    }
    siteData.id = siteId

    if (site.devices) {
      await Promise.all(
        _.map(site.devices, async device => {
          const existingDevice = await knex('Device')
            .where({ partnerId, serial: device.serial })
            .first(
              'id',
              'siteId',
              'deviceTypeId',
              'name',
              'shortName',
              'macAddress',
              'hostId',
              'timezone',
              'configurationData'
            )
          const { id: deviceTypeId } = await knex('DeviceType')
            .where('externalId', device.deviceType || 'CepheidGeneXpert')
            .first('id')
          let deviceId
          if (!existingDevice) {
            ;[deviceId] = await knex('Device').insert({
              partnerId,
              siteId,
              deviceTypeId,
              deviceApprovalId: await deviceApprovalToId('approved'),
              name: device.name,
              shortName: device.shortName,
              serial: device.serial,
              macAddress: device.macAddress,
              hostId: device.hostId,
              culture: country.culture,
              timezone: siteData.timezoneId,
              configurationData: device.gxAlertDeviceId ? `{"gxAlertDeviceId":${device.gxAlertDeviceId}}` : '{}',
              ...auditFields,
            })
          } else {
            deviceId = existingDevice.id
            const deviceConfigurationData = JSON.parse(
              existingDevice.configurationData ? existingDevice.configurationData : '{}'
            )
            if (deviceConfigurationData.gxAlertDeviceId !== device.gxAlertDeviceId) {
              deviceConfigurationData.gxAlertDeviceId = device.gxAlertDeviceId
            }
            if (
              existingDevice.siteId !== siteId ||
              existingDevice.deviceTypeId !== deviceTypeId ||
              existingDevice.name !== device.name ||
              existingDevice.shortName !== device.shortName ||
              existingDevice.macAddress !== device.macAddress ||
              existingDevice.hostId !== device.hostId ||
              existingDevice.timezone !== siteData.timezoneId ||
              existingDevice.configurationData !== JSON.stringify(deviceConfigurationData)
            ) {
              await knex('Device')
                .where('id', existingDevice.id)
                .update({
                  siteId,
                  deviceTypeId: await deviceTypeToId(device.deviceType),
                  name: device.name,
                  shortName: device.shortName,
                  serial: device.serial,
                  macAddress: device.macAddress,
                  hostId: device.hostId,
                  culture: country.culture,
                  timezone: siteData.timezoneId,
                  configurationData: JSON.stringify(deviceConfigurationData),
                  updatedOn: now,
                  updatedBy: adminId,
                })
            }
          }
          if (device.apiKey) {
            const existingDeviceApiKey = await knex('DeviceApiKey').where('token', device.apiKey).first()
            if (!existingDeviceApiKey) {
              await knex('DeviceApiKey').insert({
                token: device.apiKey,
                deviceId,
                geographyId: siteGeographyId,
                siteId,
                revoked: false,
                createdOn: now,
                createdBy: adminId,
                updatedOn: now,
                updatedBy: adminId,
                partnerId,
              })
            } else if (!existingDeviceApiKey.deviceId) {
              await knex('DeviceApiKey').where('id', existingDeviceApiKey.id).update({
                deviceId,
                updatedOn: now,
                updatedBy: adminId,
              })
            }
          }
        })
      )
    }
  })
}

const createClientDeviceApiKey = async (knex, data) => {
  const { deviceTypePayload, devicePayload, deviceApiKeyPayload } = data

  const [deviceTypeId] = await knex('DeviceType').insert(deviceTypePayload)

  const [deviceId] = await knex('Device').insert({
    ...devicePayload,
    deviceTypeId,
  })

  const now = new Date()

  return knex('DeviceApiKey').insert({
    ...deviceApiKeyPayload,
    deviceId,
    revoked: false,
    createdOn: now,
    updatedOn: now,
  })
}

async function getOrInsertGeography(knex, countryId) {
  const geography = await knex('Geography').select('id').where({ countryId, stateId: null, lgaId: null }).first()

  let geographyId
  if (geography) {
    geographyId = geography.id
  } else {
    const [newId] = await knex('Geography').insert({ countryId }).returning('id')
    geographyId = newId
  }
  return geographyId
}

module.exports = {
  commonUpserts,
  upsertJobFunctionPermission,
  upsertGeneXpertDeviceTypeAndAssays,
  upsertSites,
  upsertStatesAndLgas,
  upsertAssayResultCategories,
  upsertJobFunction,
  clonePermissions,
  copyPermissionsAndDashboardWidgetsFromJobFunction,
  baseGxAlertMigration,
  seedLabClinicFixture,
  ensureResultTreatmentStatuses,
  upsertDashboardWidgets,
  upsertJobFunctionFixture,
  upsertPermissionFixture,
  getStatesByName,
  upsertGeography,
  createClientDeviceApiKey,
  getOrInsertGeography,
}
