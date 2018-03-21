module.exports = require('../../src/db').seed(seed)

const bcrypt = require('bcrypt')
const _ = require('lodash')

const config = require('../../src/config')
const myanmarSites = require('./fixtures/myanmarSites.json')
const patients = require('./fixtures/patients.json')
const dashboardWidget = require('./fixtures/myanmarDashboardWidget.json')
const { addMilliseconds, addMinutes, subDays } = require('date-fns')

const now = new Date()
const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 365

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'myanmar_admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: 'myanmar_admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [
    partnerTypes,
    deviceTypes,
    deviceStatuses,
    assays,
    sampleTypes,
    resultCategories,
    resultSources,
    resultTypes,
    resultWorkflowStatuses,
    issueTypes,
    defaultMessageTypes,
  ] = await Promise.all([
    rowsAsObject(knex, 'PartnerType', 'name'),
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    rowsAsObject(knex, 'DeviceStatus', 'token'),
    rowsAsObject(knex, 'Assay', 'externalId'),
    rowsAsObject(knex, 'SampleType', 'externalId'),
    rowsAsObject(knex, 'ResultCategory', 'externalId'),
    rowsAsObject(knex, 'ResultSource', 'externalId'),
    rowsAsObject(knex, 'ResultType', 'externalId'),
    rowsAsObject(knex, 'ResultWorkflowStatus', 'externalId'),
    rowsAsObject(knex, 'IssueType', 'externalId'),
    getDefaultMessageTypes(knex),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'Myanmar',
    partnerTypeId: partnerTypes.Operating.id,
    // plugin: 'myanmar',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
  })

  const modules = await knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})

  const [myanmarCountry] = await knex('Country as c')
    .where({ 'c.a3': 'MMR' })
    .select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first()

  const myanmarStates = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
    .whereNull('g.lgaId')
    .select('s.id', 's.name', 's.abbreviation')

  const myanmarLgas = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .where({ 'g.countryId': countryId })
    .select('l.id', 'l.name')

  const statesByAbbreviation = myanmarStates.reduce((memo, state) => {
    memo[state.abbreviation] = state
    return memo
  }, {})

  const lgasByName = myanmarLgas.reduce((memo, lga) => {
    memo[lga.name] = lga
    return memo
  }, {})

  // Permissions for Myanmar Admin
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Myanmar Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId: myanmarGeographyId,
        culture: myanmarCountry.culture,
        timezone: myanmarCountry.timezone,
      },
      auditFields
    )
  )

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })

  const [jobFunctionIdRegionalOfficer] = await knex('JobFunction').insert({
    name: 'Regional Officer',
    partnerId,
  })

  const [jobFunctionIdLabUser] = await knex('JobFunction').insert({
    name: 'Lab User',
    partnerId,
  })

  await knex('JobFunctionPermission').insert([
    // Admin Permissions
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.task.admin },

    // Regional Officer Permissions
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.site.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.task.admin,
    },

    // Lab User Permissions
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.site.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.task.admin,
    },
  ])

  // Admin Job
  const [jobIdAdmin] = await knex('Job').insert({
    personId: adminPersonId,
    jobFunctionId: jobFunctionIdAdmin,
  })
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId: myanmarGeographyId,
  })

  // Regional Officer Jobs
  const adminRegions = ['AYY', 'KCN', 'MDY']
  let regionNumber = 0
  await Promise.all(
    _.map(adminRegions, async region => {
      regionNumber += 1
      const regionUserName = `myanmar_ro${regionNumber}`
      const { id: regionId } = await knex('Geography')
        .where({
          countryId,
          stateId: statesByAbbreviation[region].id,
        })
        .first()
      const [regionUserId] = await knex('User').insert({
        name: regionUserName,
        password: bcrypt.hashSync(regionUserName, saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0,
      })
      const [regionPersonId] = await knex('Person').insert(
        Object.assign(
          {
            userId: regionUserId,
            name: `Myanmar Regional Officer ${region}`,
            lastPartnerId: partnerId,
            lastCountryId: countryId,
            geographyId: myanmarGeographyId,
            culture: myanmarCountry.culture,
            timezone: myanmarCountry.timezone,
          },
          auditFields
        )
      )
      const [jobIdRegion] = await knex('Job').insert({
        personId: regionPersonId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
      })
      await knex('JobContext').insert({
        jobId: jobIdRegion,
        geographyId: regionId,
      })
    })
  )

  // every clinic has a site, GxAlert device and MTB/Rif+ and Ultra results
  const possibleResults = [
    {
      resultText: 'Not Detected',
      category1: resultCategories.NotDetected.id,
      category2: null,
    },
    {
      resultText: 'MTB Detected, Rif Resistance Not Detected',
      category1: resultCategories.Detected.id,
      category2: resultCategories.NotDetected.id,
    },
    {
      resultText: 'MTB Detected, Rif Indeterminate',
      category1: resultCategories.Detected.id,
      category2: resultCategories.Indeterminate.id,
    },
    {
      resultText: 'ERROR',
      category1: resultCategories.Error.id,
      category2: null,
    },
    {
      resultText: 'Invalid',
      category1: resultCategories.Invalid.id,
      category2: null,
    },
  ]

  const resultData = {
    probes: {
      probeA: 'NEG',
      probeB: 'POS',
      probeC: 'NO RESULT',
      probeD: 'NEG',
      probeE: 'POS',
      probeSpc: 'NO RESULT',
      qc1: 'YES',
      qc2: 'No',
      probeACt: 12.32,
      probeBCt: 11.2,
      probeCCt: 12.5,
      probeDCt: 0.5,
      probeECt: 1.2,
      probeSpcCt: 5.78,
      qc1Ct: 1,
      qc2Ct: 0.007,
      probeAEndpt: 1.6,
      probeBEndpt: 2.33,
      probeCEndpt: 457,
      probeDEndpt: 12.43,
      probeEEndpt: 3.14,
      probeSpcEndpt: 8.9018,
      qc1Endpt: 0.1234,
      qc2Endpt: 1.22,
    },
  }

  await Promise.all(
    _.map(myanmarSites.sites, async site => {
      const { id: siteGeographyId } = await knex('Geography')
        .where({
          countryId,
          stateId: (
            statesByAbbreviation[site.stateAbbreviation] || { id: null }
          ).id,
          lgaId: (lgasByName[site.lgaName] || { id: null }).id,
        })
        .first()

      // sites
      const siteData = Object.assign(
        {
          partnerId,
          geographyId: siteGeographyId,
          name: site.name,
          shortname: site.shortname,
          externalId: site.externalId,
          notes: site.notes,
          city: site.city,
          street1: site.street1,
          street2: site.street2,
          zip: site.zip,
          latitude: site.latitude,
          longitude: site.longitude,
          timezoneId: site.timezoneId,
          hoursStart: site.hoursStart,
          hoursEnd: site.hoursEnd,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
      siteData.id = siteId

      // only create results if in managed regions
      const samples = []
      await Promise.all(
        _.map(_.range(500), async i => {
          const sample = Object.assign(
            {},
            {
              externalId: `SMP-TB-${i}`,
              collectedOn: calculateDateForResult(i, 500, millisInMinute),
              sampleTypeId: sampleTypes.DBS.id,
              originSiteId: siteData.id,
            }
          )

          sample.id = await knex('Sample').insert(sample)
          samples.push(sample)
        })
      )

      await Promise.all(
        _.map(site.devices, async deviceSeed => {
          const device = {
            partnerId,
            geographyId: siteGeographyId,
            siteId,
            deviceTypeId: deviceTypes.CepheidGeneXpert.id,
            deviceStatusId: deviceStatuses.approved.id,
            name: deviceSeed.name,
            shortname: deviceSeed.shortname,
            macAddress: deviceSeed.macAddress,
            serial: deviceSeed.serial,
            hostId: deviceSeed.hostId,
            culture: deviceSeed.culture,
            timezone: deviceSeed.timezone,
            notes: deviceSeed.notes,
            lastSeenOn: now,
          }
          const [deviceId] = await knex('Device').insert(device)
          device.id = deviceId

          // only create results if managed region
          const resultMtbNumber = 1000 + Math.floor(Math.random() * 200 - 100)
          await Promise.all(
            _.map(_.range(resultMtbNumber), async i => {
              const sample = samples[i % samples.length]
              const randomDate = calculateDateForResult(
                i,
                resultMtbNumber,
                6000
              )

              let j = 0
              await Promise.all(
                _.map(possibleResults, async result => {
                  j += 1
                  if (_.random(4) === 0) {
                    resultData.resultText = result.resultText
                    await knex('Result').insert(
                      Object.assign({}, auditFields, {
                        externalId: `UQTB-${i}-${j}`,
                        assayId: assays.GxMtbRif.id,
                        partnerId,
                        geographyId: siteData.geographyId,
                        siteId: siteData.id,
                        deviceId: device.id,
                        resultWorkflowStatusId:
                          resultWorkflowStatuses.Ordered.id,
                        longitude: siteData.latitude,
                        latitude: siteData.longitude,
                        resultSourceId: resultSources.DiagnosticDevice.id,
                        resultTypeId: resultTypes.Patient.id,
                        sampleId: sample.id,
                        sampleRunNumber: `${i % 2 + 1}`,
                        sampleGroup: `GRP-TB-${i % 5}`,
                        resultCategory1: result.category1,
                        resultCategory2: result.category2,
                        resultData: JSON.stringify(resultData),
                        assayVersion: '4',
                        startedOn: randomDate,
                        endedOn: addMinutes(randomDate, 100),
                        consumableSerial: `${i}12`,
                        consumableExpirationDate: new Date(
                          +now + 200 * i * millisInHour
                        ),
                        consumableLot: `Lot ${i % 5}`,
                        instrumentSerial: `S-1234-${i % 3}`,
                        moduleName: 'Module A',
                        moduleSerial: `M-1234-${i % 4}`,
                        researchId: `R-ID-${i}`,
                        patientData: JSON.stringify(patients[_.random(99)]),
                        senderVersion: '4.6b',
                        senderOperator: 'Marsha',
                        notes: 'This is a test... result',
                        errorCode:
                          result.category1 === resultCategories.Error.id
                            ? '1024'
                            : null,
                        errorNotes:
                          result.category1 === resultCategories.Error.id
                            ? 'Exceeded cycle threshold'
                            : null,
                      })
                    )
                  }
                })
              )
            })
          )
        })
      )
    })
  )

  // Lab User Jobs
  let labNumber = 0
  await Promise.all(
    _.map(adminRegions, async region => {
      labNumber += 1
      const labUserName = `myanmar_lab${labNumber}`
      const { siteId, geographyId } = await knex('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .where({
          's.partnerId': partnerId,
          'g.countryId': countryId,
          'g.stateId': statesByAbbreviation[region].id,
        })
        .first('s.id as siteId', 'g.id as geographyId')
      const [labUserId] = await knex('User').insert({
        name: labUserName,
        password: bcrypt.hashSync(labUserName, saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0,
      })
      const [labPersonId] = await knex('Person').insert(
        Object.assign(
          {
            userId: labUserId,
            name: `Myanmar Lab User ${region}`,
            lastPartnerId: partnerId,
            lastCountryId: countryId,
            geographyId,
            culture: myanmarCountry.culture,
            timezone: myanmarCountry.timezone,
          },
          auditFields
        )
      )
      const [jobIdLab] = await knex('Job').insert({
        personId: labPersonId,
        jobFunctionId: jobFunctionIdLabUser,
      })
      await knex('JobContext').insert({
        jobId: jobIdLab,
        siteId,
      })
    })
  )

  // Create DashboardWidget
  const widgetIds = []
  await Promise.all(
    _.map(dashboardWidget, async widget => {
      const [widgetId] = await knex('DashboardWidget').insert(widget)
      widgetIds.push(widgetId)
    })
  )

  await Promise.all(
    _.map(widgetIds, async widgetId => {
      await knex('JobFunctionDashboardWidget').insert([
        { jobFunctionId: jobFunctionIdAdmin, widgetId },
        { jobFunctionId: jobFunctionIdRegionalOfficer, widgetId },
        { jobFunctionId: jobFunctionIdLabUser, widgetId },
      ])
    })
  )

  // Notifications
  await knex('NotificationType').insert([
    Object.assign(
      {
        name: 'LU Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
  ])
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}

function getDefaultMessageTypes(knex) {
  return knex('MessageType as mt')
    .join('IssueType as it', 'it.defaultMessageTypeId', 'mt.id')
    .select('it.externalId as issueTypeExternalId', 'mt.*')
    .reduce((memo, row) => {
      memo[row.issueTypeExternalId] = row
      return memo
    }, {})
}

function calculateDateForResult(
  currentResult,
  totalResults,
  randomMillisToAdd
) {
  const daysToSubtract =
    resultTimeFrameInDays -
    Math.ceil(currentResult / totalResults * resultTimeFrameInDays)

  return addMilliseconds(
    subDays(now, daysToSubtract),
    _.random(randomMillisToAdd)
  )
}
