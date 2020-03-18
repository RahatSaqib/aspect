module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const { addHours, addMilliseconds, addMinutes, subDays } = require('date-fns')
const Promise = require('bluebird')

const {
  commonUpserts,
  upsertJobFunctionPermission,
  upsertJobFeatures,
} = require('../common')
const { upsertCovidAssay } = require('../commonCovid')
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

const millisInHour = 1000 * 60 * 60
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
    name: 'moz_admin',
    password: bcrypt.hashSync('moz123', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: 'Mozambique',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'http://localhost:8000/',
    plugin: 'mozambique',
  })

  const countryMozambique = geography.countries.find(
    country => country.abbreviation === 'MZ'
  )

  const countryData = _.pick(countryMozambique, [
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
      countries: [countryMozambique],
    },
    'MZ'
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

  await upsertCovidAssay(knex)

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

  const { id: deviceTypeCovidId } = await knex('DeviceType')
    .where('externalId', 'GenericCovid19')
    .first('id')
  const deviceStatusApprovedId = await deviceStatusToId('approved')

  await Promise.all(
    _.map(countryMozambique.states, async state => {
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
              ...auditFields,
            }

            const [siteId] = await knex('Site').insert(labData)
            labData.id = siteId
            countryData.labs.push(labData)

            // add device to the lab
            const device = {
              ...auditFields,
              name: `${labData.name} COVID-19 Device`,
              shortName: `${labData.externalId}_covid_19`,
              deviceTypeId: deviceTypeCovidId,
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

  // add result form
  const { id: assayId } = await knex('Assay')
    .where('externalId', 'assayGenericCovid19')
    .first('id')
  const formSchema = JSON.stringify({
    fields: {
      testReason: {
        i18nLabel: 'testReasonCovid19',
        control: {
          type: 'DropDown',
          options: [
            {
              i18nText: 'contactOfACase',
              value: '1',
            },
            {
              i18nText: 'illSeekingHealthcare',
              value: '2',
            },
            {
              i18nText: 'detectedAtPointOfEntry',
              value: '3',
            },
            {
              i18nText: 'repatriation',
              value: '4',
            },
            {
              i18nText: 'routineRespiratorySurveillance',
              value: '5',
            },
            {
              i18nText: 'unknown',
              value: '6',
            },
          ],
        },
        order: 1,
      },
      caseId: {
        i18nLabel: 'caseId',
        control: {
          type: 'TextBox',
        },
        order: 2,
      },
      age: {
        i18nLabel: 'age',
        control: {
          type: 'TextBox',
        },
        order: 3,
      },
      gender: {
        i18nLabel: 'gender',
        control: {
          type: 'DropDown',
          options: [
            {
              i18nText: 'male',
              value: '1',
            },
            {
              i18nText: 'female',
              value: '2',
            },
          ],
        },
        order: 4,
      },
    },
    sendChangesOn: 'change',
  })

  await knex('ResultForm').insert({
    partnerId,
    assayId,
    formSchema,
  })

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

    const rnd = _.random(0, 100)
    const result = _.find(
      possibleResults,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )

    const formData = JSON.stringify({
      age: rnd,
      caseId: `COVID-${_.random(1000, 9999)}-ID`,
      gender: _.random(1, 2),
      testReason: _.random(1, 6),
    })

    const resultId = await knex('Result').insert({
      ...auditFields,
      externalId: `COVID-${i}`,
      assayId,
      partnerId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      reportableSiteId: sample.siteOriginId || siteData.id,
      deviceId: device.id,
      longitude: -81.581222,
      latitude: 28.419348,
      resultSourceId: resultSourceEnteredByHandId,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      sampleGroup: `GRP-COVID-${i % 5}`,
      resultCategory1: result.category1,
      resultCategory2: result.category2,
      resultData: JSON.stringify({ resultText: result.resultText }),
      formData,
      patientData: formData,
      startedOn: randomDate,
      endedOn: addMinutes(randomDate, 100),
      createdOn: addMinutes(randomDate, 120),
      updatedOn: addMinutes(randomDate, 180),
      consumableSerial: `${i}12`,
      consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
      consumableLot: `Lot ${i % 5}`,
      researchId: `R-ID-${i}`,
    })

    const [lastLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: resultWorkflowStatusDeliverableId,
      operator: 'John',
      changedOn: addMinutes(randomDate, 120),
      createdOn: addMinutes(randomDate, 120),
      createdBy: adminId,
    })

    await knex('Result')
      .where('id', resultId)
      .update({ resultWorkflowStatusLogId: lastLogId })

    await knex('DeviceLog').insert({
      deviceId: device.id,
      createdOn: addHours(randomDate, 1),
      senderIp: '0.0.0.0',
      source: 'seed data',
      rawMessage: JSON.stringify({
        type: {
          id: 'GenericCovid19',
          site: {
            id: siteData.externalId,
          },
          result: {
            data: {
              ...auditFields,
              externalId: `COVID-${i}`,
              assayId,
              partnerId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              reportableSiteId: sample.siteOriginId || siteData.id,
              deviceId: device.id,
              resultSourceId: resultSourceEnteredByHandId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${(i % 2) + 1}`,
              sampleGroup: `GRP-COVID-${i % 5}`,
              resultCategory1: result.category1,
              resultCategory2: result.category2,
              resultData: JSON.stringify({ resultText: result.resultText }),
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 100),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              researchId: `R-ID-${i}`,
            },
          },
        },
      }),
      deviceConfigurationUpdated: 0,
      resultId,
    })
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
      .where('r.assayId', assayId)
      .where('rca.requiresTreatment', true)
      .select('r.id', 'r.createdOn', 'r.assayId', 'r.createdBy'),
    85,
    90
  )

  // add follow ups
  await utils.addFollowUps(knex, [partnerId], followUp)
}
