module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const { addMilliseconds, addMinutes, subDays } = require('date-fns')
const Promise = require('bluebird')

const {
  commonUpserts,
  upsertJobFunctionPermission,
  upsertJobFeatures,
} = require('../common')
const { upsertCovidDeviceTypes } = require('../commonCovid')
const {
  normalizeTreatmentStatusDistributionByResults,
} = require('../commonGenerateResults')
const config = require('../../src/config')
const {
  allFeatureToId,
  partnerTypeToId,
  deviceStatusToId,
  allSampleTypeToId,
  allResultCategoryToId,
  resultSourceToId,
  resultTypeToId,
  resultWorkflowStatusToId,
} = require('../../src/shared/dictionary')
const utils = require('../utils')

const geography = require('./fixtures/geography.json')
const followUp = require('../fixtures/FollowUp.json')
const AssayCovidResultFormSchema = require('../fixtures/AssayCovidResultFormSchema.json')

const millisInMinute = 1000 * 60
const saltRounds = parseInt(config.passwordSaltRounds, 10)
const resultTimeFrameInDays = 60
const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultNumber = resultMultiplier * 10
const now = new Date()

function calculateDateForResult(
  currentResult,
  totalResults,
  randomMillisToAdd
) {
  // unlike TB and HIV, we want to generate an exponential curve here
  const daysToSubtract = Math.ceil(Math.random() ** 4 * resultTimeFrameInDays)

  return addMilliseconds(
    subDays(now, daysToSubtract),
    _.random(randomMillisToAdd)
  )
}

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: 'covid_admin',
    password: bcrypt.hashSync('covid', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: 'Wakanda',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'http://localhost:8000/',
    plugin: 'wakanda',
  })

  const countryWakanda = geography.countries.find(
    country => country.abbreviation === 'WK'
  )

  const countryData = _.pick(countryWakanda, [
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

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    {
      countries: [countryWakanda],
    },
    'WK'
  )

  // Give permission to dashboard, browse, sites, results, devices, reporters
  const features = await allFeatureToId()
  const modules = await utils.getPermissionModules(knex)

  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where('name', 'Admin')
    .where({ partnerId })
    .first('id')

  await upsertJobFunctionPermission(knex, jobFunctionIdAdmin, [
    modules.demo.admin,
    modules.deviceApiKey.admin,
    modules.issue.admin,
    modules.inventory.admin,
    modules.task.admin,
    modules.patient.admin,
  ])

  await upsertJobFeatures(knex, jobFunctionIdAdmin, [
    features.summaryDashboard,
    features.account,
    features.resultDashboard,
  ])

  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where('name', 'Regional Officer')
    .where({ partnerId })
    .first('id')

  await upsertJobFunctionPermission(knex, jobFunctionIdRegionalOfficer, [
    modules.device.admin,
    modules.result.admin,
    modules.site.admin,
    modules.issue.admin,
    modules.inventory.admin,
    modules.task.admin,
    modules.patient.admin,
  ])

  await upsertJobFeatures(knex, jobFunctionIdRegionalOfficer, [
    features.summaryDashboard,
    features.account,
    features.resultDashboard,
  ])

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where('name', 'Lab User')
    .where({ partnerId })
    .first('id')

  await upsertJobFunctionPermission(knex, jobFunctionIdLabUser, [
    modules.device.edit,
    modules.result.edit,
    modules.site.edit,
    modules.issue.edit,
    modules.inventory.edit,
    modules.task.edit,
    modules.patient.edit,
  ])

  await upsertJobFeatures(knex, jobFunctionIdLabUser, [
    features.summaryDashboard,
    features.account,
    features.resultDashboard,
  ])

  const covidDeviceTypes = (
    await upsertCovidDeviceTypes(knex, partnerId, AssayCovidResultFormSchema)
  ).filter(deviceType => deviceType.externalId !== 'Aspect')
  const deviceTypeAssays = {}
  await Promise.each(
    covidDeviceTypes.map(deviceType => deviceType.id),
    async deviceTypeId => {
      deviceTypeAssays[deviceTypeId] = await knex('Assay as a')
        .join('AssayType as at', 'a.assayTypeId', 'at.id')
        .where('a.deviceTypeId', deviceTypeId)
        .andWhere('at.externalId', 'covid19')
        .first('a.*')
    }
  )

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // seed sites and devices
  countryData.labs = []
  countryData.clinics = []
  countryData.devices = []

  const deviceStatusApprovedId = await deviceStatusToId('approved')

  await Promise.all(
    _.map(countryWakanda.states, async state => {
      await Promise.all(
        _.map(state.lgas, async lga => {
          if (lga.cities) {
            // one lab for every lga that has clinics/cities:
            const { id: lgaId } = await knex('Lga')
              .where('name', lga.name)
              .first('id')

            const { id: geographyId } = await knex('Geography')
              .where({ lgaId })
              .first('id')

            const labData = {
              partnerId,
              geographyId,
              externalId: `${_.snakeCase(lga.name)}_lab`,
              name: `${lga.name} Lab`,
              shortName: `${lga.name} Lab`,
              city: lga.name,
              street1: `${state.name} Street`,
              longitude: _.random(9, 12, true),
              latitude: _.random(-20, -23, true),
              ...auditFields,
            }

            const [siteId] = await knex('Site').insert(labData)
            labData.id = siteId
            countryData.labs.push(labData)

            // add device to the lab
            const deviceType =
              covidDeviceTypes[
                state.lgas.indexOf(lga) % covidDeviceTypes.length
              ]
            const device = {
              ...auditFields,
              name: `${labData.name} Aspect`,
              shortName: `${labData.externalId}_aspect`,
              deviceTypeId: deviceType.id,
              deviceStatusId: deviceStatusApprovedId,
              partnerId: labData.partnerId,
              geographyId: labData.geographyId,
              siteId: labData.id,
              defaultReportableSiteId: labData.id,
              ...auditFields,
              lastPingOn: new Date(+now),
              lastSeenOn: new Date(+now),
              hostId: _.times(8, () =>
                String.fromCharCode(
                  65 + _.random(25) + (_.random(1) > 0 ? 32 : 0)
                )
              ).join(''),
              serial: _.times(24, () =>
                String.fromCharCode(
                  65 + _.random(25) + (_.random(1) > 0 ? 32 : 0)
                )
              ).join(''),
            }

            device.id = await knex('Device').insert(device)
            countryData.devices.push(device)

            // add clinics in the LGA
            await Promise.all(
              _.map(lga.cities, async city => {
                // add clinic
                const { id: lgaId } = await knex('Lga')
                  .where('name', lga.name)
                  .first('id')

                const { id: geographyId } = await knex('Geography')
                  .where({ lgaId })
                  .first('id')

                const clinicData = {
                  partnerId,
                  geographyId,
                  externalId: `${_.snakeCase(city)}_clinic`,
                  name: `${city} Clinic`,
                  shortName: `${city} Clinic`,
                  city,
                  street1: `${lga.name} Street`,
                  longitude: _.random(9, 12, true),
                  latitude: _.random(-20, -23, true),
                  ...auditFields,
                }

                const [siteId] = await knex('Site').insert(clinicData)
                clinicData.id = siteId
                countryData.clinics.push(clinicData)
              })
            )
          }
        })
      )
    })
  )

  // seed dummy results
  const { NasalSwab: sampleTypeNasalSwab } = await allSampleTypeToId()
  const {
    Positive: resultCategoryPositiveId,
    Negative: resultCategoryNegativeId,
    Inconclusive: resultCategoryInconclusiveId,
    Unknown: resultCategoryUnknownId,
  } = await allResultCategoryToId()
  const resultSourceEnteredByHandId = await resultSourceToId('EnteredByHand')
  const resultTypePatientId = await resultTypeToId('Patient')
  const resultWorkflowStatusProcessedId = await resultWorkflowStatusToId(
    'Processed'
  )
  const resultWorkflowStatusValidatedId = await resultWorkflowStatusToId(
    'Validated'
  )
  const resultWorkflowStatusDeliverableId = await resultWorkflowStatusToId(
    'Deliverable'
  )

  // seed samples
  const samples = []
  await Promise.each(_.range(resultNumber), async i => {
    const siteData = countryData.clinics[i % countryData.clinics.length]
    const sample = {
      externalId: `SMP-CV-${i}`,
      collectedOn: calculateDateForResult(i, resultNumber, millisInMinute),
      sampleTypeId: sampleTypeNasalSwab,
      originSiteId: siteData.id,
    }

    sample.id = await knex('Sample').insert(sample)

    samples.push(sample)
  })

  const possibleResults = [
    {
      category1: resultCategoryPositiveId,
      category2: null,
      minLikelihood: 0,
      maxLikelihood: 30,
      resultText: 'Positive',
    },
    {
      category1: resultCategoryNegativeId,
      category2: null,
      minLikelihood: 31,
      maxLikelihood: 90,
      resultText: 'Negative',
    },
    {
      category1: resultCategoryInconclusiveId,
      category2: null,
      minLikelihood: 91,
      maxLikelihood: 96,
      resultText: 'Inconclusive',
    },
    {
      category1: resultCategoryUnknownId,
      category2: null,
      minLikelihood: 97,
      maxLikelihood: 100,
      resultText: 'Unknown',
    },
  ]

  await Promise.each(_.range(resultNumber), async i => {
    const device = countryData.devices[i % countryData.devices.length]
    const siteData = countryData.labs.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultNumber, 6000)
    const reportableSite = sample.originSiteId
      ? _.find(countryData.clinics, c => c.id === sample.originSiteId)
      : siteData

    const rnd = _.random(0, 100)
    const result = _.find(
      possibleResults,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )

    const formData = {
      age: rnd,
      caseId: `COVID-${_.random(1000, 9999)}-ID`,
      gender: _.random(1, 2),
      testReason: _.random(1, 6),
    }

    const resultId = await knex('Result').insert({
      ...auditFields,
      externalId: `COVID-${i}`,
      assayId: deviceTypeAssays[device.deviceTypeId].id,
      partnerId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      reportableSiteId: reportableSite.id,
      deviceId: device.id,
      longitude: reportableSite.longitude,
      latitude: reportableSite.latitude,
      resultSourceId: resultSourceEnteredByHandId,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      resultCategory1: result.category1,
      resultCategory2: result.category2,
      resultData: JSON.stringify({ resultText: result.resultText }),
      formData: JSON.stringify(formData),
      patientData: JSON.stringify({
        age: formData.age,
        caseId: formData.caseId,
        gender:
          AssayCovidResultFormSchema.fields.gender.control.options[
            formData.gender - 1
          ].title,
        testReason:
          AssayCovidResultFormSchema.fields.testReason.control.options[
            formData.testReason - 1
          ].title,
      }),
      startedOn: randomDate,
      endedOn: addMinutes(randomDate, 100),
      createdOn: addMinutes(randomDate, 120),
      updatedOn: addMinutes(randomDate, 180),
    })

    const rndWorkflow = _.random(0, 100)
    const resultWorkflowStatusId =
      rndWorkflow < 20
        ? resultWorkflowStatusProcessedId
        : rndWorkflow < 30
        ? resultWorkflowStatusValidatedId
        : resultWorkflowStatusDeliverableId

    const [lastLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId,
      operator: 'John',
      changedOn: addMinutes(randomDate, 120),
      createdOn: addMinutes(randomDate, 120),
      createdBy: adminId,
    })

    await knex('Result')
      .where('id', resultId)
      .update({ resultWorkflowStatusLogId: lastLogId })
  })

  // assign treatment status
  await normalizeTreatmentStatusDistributionByResults(
    knex,
    await knex('Result as r')
      .join('ResultCategoryAssay as rca', function() {
        this.on('r.assayId', 'rca.assayId').andOn(
          'r.resultCategory1',
          'rca.resultCategoryId'
        )
      })
      .whereIn(
        'r.assayId',
        Object.values(deviceTypeAssays).map(assay => assay.id)
      )
      .andWhere('rca.requiresTreatment', true)
      .select('r.id', 'r.createdOn', 'r.assayId', 'r.createdBy'),
    85,
    90
  )

  // add follow ups
  await utils.addFollowUps(knex, [partnerId], followUp)

  const statWidgets = await knex('DashboardWidget')
    .whereIn('titleI18nKey', [
      'dashboardWidgetTitleConfirmedCases',
      'dashboardWidgetTitleTotalActiveCases',
      'dashboardWidgetTitleTotalRecoveredCases',
      'dashboardWidgetTitleTotalDeaths',
    ])
    .select('id as widgetId')
  await Promise.each(statWidgets, async elem =>
    knex('JobFunctionDashboardWidget').insert([
      { jobFunctionId: jobFunctionIdAdmin, widgetId: elem.widgetId },
    ])
  )
}
