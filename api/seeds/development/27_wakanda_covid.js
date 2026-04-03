module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const Promise = require('bluebird')
const { subMonths } = require('date-fns')
const { resultCategoryToId, allSiteTypeToId } = require('../../src/shared/dictionary')
const { commonUpserts } = require('../common')
const { upsertCovidDeviceTypes } = require('../commonCovid')
const { normalizeTreatmentStatusDistributionByResults, addCovidResults } = require('../commonGenerateResults')
const config = require('../../src/config')
const { partnerTypeToId, deviceApprovalToId } = require('../../src/shared/dictionary')
const utils = require('../utils')
const jobFunctionsFixtureWakanda = require('./fixtures/jobFunctions_wakanda')
const { insertSite } = require('../../src/site/common/db')

const geography = require('./fixtures/geography.json')
const followUp = require('../fixtures/FollowUp.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultNumber = resultMultiplier * 8
const now = new Date()

async function seed(knex) {
  utils.hasSeededStaticData = true
  const resultCategoryPositiveId = await resultCategoryToId('Positive')
  const { id: countryId } = await knex('Country').where('name', 'Wakanda').first('id')

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
    externalId: 'wakanda',
    partnerTypeId: await partnerTypeToId('operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'http://localhost:8000/',
    plugin: 'wakanda',
  })

  const countryWakanda = geography.countries.find(country => country.abbreviation === 'WK')

  const countryData = _.pick(countryWakanda, [
    'abbreviation',
    'name',
    'a3',
    'culture',
    'countryCode',
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
    'WK',
    null,
    {
      fixtures: {
        jobFunctions: jobFunctionsFixtureWakanda,
      },
    }
  )

  const { id: jobFunctionIdClinician } = await knex('JobFunction')
    .where('name', 'Clinician')
    .where({ partnerId })
    .first('id')

  const covidDeviceTypes = (await upsertCovidDeviceTypes(knex)).filter(deviceType => deviceType.externalId !== 'Aspect')
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

  const deviceApprovalApprovedId = await deviceApprovalToId('approved')
  const siteTypeIds = await allSiteTypeToId()

  await Promise.all(
    _.map(countryWakanda.states, async state => {
      await Promise.all(
        _.map(state.lgas, async lga => {
          if (lga.cities) {
            // one lab for every lga that has clinics/cities:
            const { id: lgaId } = await knex('Lga').where('name', lga.name).first('id')

            const { id: geographyId } = await knex('Geography').where({ lgaId }).first('id')

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

            const [siteId] = await insertSite(knex, labData)
            labData.id = siteId
            countryData.labs.push(labData)

            // add device to the lab
            const deviceType = covidDeviceTypes[state.lgas.indexOf(lga) % covidDeviceTypes.length]
            const device = {
              name: `${labData.name} ${deviceType.name}`.substr(0, 255),
              shortName: `${labData.externalId}_${deviceType.externalId}`.substr(0, 45),
              deviceTypeId: deviceType.id,
              deviceApprovalId: deviceApprovalApprovedId,
              partnerId: labData.partnerId,
              siteId: labData.id,
              defaultReportableSiteId: labData.id,
              ...auditFields,
              lastPingOn: new Date(+now),
              lastPingFromIp: `61.30.120.${Math.floor(Math.random() * 255)}`,
              lastSeenOn: new Date(+now),
              putInService: subMonths(now, 2),
              hostId: _.times(8, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
              serial: _.times(24, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
            }

            ;[device.id] = await knex('Device').insert(device)
            countryData.devices.push({ ...device, geographyId })

            // add clinics in the LGA
            await Promise.all(
              _.map(lga.cities, async city => {
                // add clinic
                const { id: lgaId } = await knex('Lga').where('name', lga.name).first('id')

                const { id: geographyId } = await knex('Geography').where({ lgaId }).first('id')

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
                  siteTypeId: siteTypeIds.clinic,
                  ...auditFields,
                }

                const [siteId] = await insertSite(knex, clinicData)
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
  const covidResults = await addCovidResults(
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
  const covidAssays = await knex('Assay as a')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .where('at.externalId', 'covid19')
    .select('a.*')
  const covidPositiveResults = _.filter(covidResults, result => result.resultCategory1 === resultCategoryPositiveId)
  await addCovidResults(
    knex,
    resultNumber,
    covidAssays,
    auditFields,
    siteDatas,
    partnerId,
    countryData.devices,
    covidPositiveResults
  )

  const clinicList = countryData.clinics
  const firstClinic = clinicList[0]
  const secondClinic = clinicList[1]

  // Create User
  const [userIdFirstClinic] = await knex('User').insert({
    name: 'covid_clinic_1',
    password: bcrypt.hashSync('covid', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const { id: siteIdFirstClinic } = await knex('Site').where('externalId', firstClinic.externalId).first('id')

  // create Person
  const [personIdFirstClinic] = await knex('Person').insert({
    userId: userIdFirstClinic,
    geographyId: firstClinic.geographyId,
    name: firstClinic.name,
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: countryData.timezone,
    culture: 'en-US',
    canLogIn: true,
    createdBy: adminId,
    createdOn: now,
    updatedBy: adminId,
    updatedOn: now,
  })

  // context for user
  await knex('JobContext').insert({
    personId: personIdFirstClinic,
    jobFunctionId: jobFunctionIdClinician,
    siteId: siteIdFirstClinic,
  })

  // Create User
  const [userIdSecondClinic] = await knex('User').insert({
    name: 'covid_clinic_2',
    password: bcrypt.hashSync('covid', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const { id: siteIdSecondClinic } = await knex('Site').where('externalId', secondClinic.externalId).first('id')

  // create Person
  const [personIdSecondClinic] = await knex('Person').insert({
    userId: userIdSecondClinic,
    geographyId: secondClinic.geographyId,
    name: secondClinic.name,
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    timezone: countryData.timezone,
    culture: 'en-US',
    canLogIn: true,
    createdBy: adminId,
    createdOn: now,
    updatedBy: adminId,
    updatedOn: now,
  })

  // context for user
  await knex('JobContext').insert({
    personId: personIdSecondClinic,
    jobFunctionId: jobFunctionIdClinician,
    siteId: siteIdSecondClinic,
  })

  // assign treatment status
  await normalizeTreatmentStatusDistributionByResults(
    knex,
    await knex('Result as r')
      .join('ResultCategoryAssay as rca', function () {
        this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
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
  await utils.upsertFollowUps(knex, followUp, [partnerId])
}
