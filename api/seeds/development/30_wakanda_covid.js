module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const Promise = require('bluebird')

const {
  commonUpserts,
  upsertJobFunctionPermission,
  upsertJobFeatures,
} = require('../common')
const { upsertCovidDeviceTypes } = require('../commonCovid')
const {
  normalizeTreatmentStatusDistributionByResults,
  addCovidResults,
} = require('../commonGenerateResults')
const config = require('../../src/config')
const {
  allFeatureToId,
  partnerTypeToId,
  deviceStatusToId,
} = require('../../src/shared/dictionary')
const utils = require('../utils')

const geography = require('./fixtures/geography.json')
const followUp = require('../fixtures/FollowUp.json')
const wakandaCovidResultFormSchema = require('./fixtures/wakandaCovidResultFormSchema.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultNumber = resultMultiplier * 10
const now = new Date()

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
    await upsertCovidDeviceTypes(knex, partnerId, wakandaCovidResultFormSchema)
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
              name: `${labData.name} ${deviceType.name}`.substr(0, 255),
              shortName: `${labData.externalId}_${deviceType.externalId}`.substr(
                0,
                45
              ),
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

  const siteDatas = [...countryData.labs, ...countryData.clinics]
  await addCovidResults(
    knex,
    resultNumber,
    await knex('Assay as a')
      .join('AssayType as at', 'a.assayTypeId', 'at.id')
      .where('at.externalId', 'covid19')
      .select('a.*'),
    auditFields,
    siteDatas,
    partnerId,
    countryData.devices
  )
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
