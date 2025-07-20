/* eslint-disable security/detect-possible-timing-attacks */
module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const _ = require('lodash')
const { addMilliseconds, addMinutes, subDays, differenceInDays, subMonths } = require('date-fns')
const { upsertJobFunctionFixture } = require('../common')
const jobFunctionsFixtureMyanmar = require('./fixtures/jobFunctions_myanmar')
const config = require('../../src/config')
const helpers = require('./fixtures/helpers')
const myanmarSites = require('./fixtures/myanmarSites.json')
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const { rowsAsObject, seedNotificationTypes, seedIssues } = require('../utils')
const { addIssueTypes } = require('../relativeObjectsSeeds')
const {
  allResultCategoryToId,
  deviceApprovalToId,
  partnerTypeToId,
  resultSourceToId,
  resultTypeToId,
  resultWorkflowStatusToId,
  sampleTypeToId,
} = require('../../src/shared/dictionary')
const { insertSite } = require('../../src/site/common/db')

const now = new Date()
const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 365

const resultMtbNumber = 100

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User').where({ name: 'myanmar_admin' }).first('id')
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
  const [deviceTypes, assays] = await Promise.all([
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    rowsAsObject(knex, 'Assay', 'externalId'),
  ])

  const maxDaysDeviceNoResults = 14
  const [partnerId] = await knex('Partner').insert({
    name: 'MoHS',
    externalId: 'mohs',
    partnerTypeId: await partnerTypeToId('operating'),
    plugin: 'mohs',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults,
    serverUrl: 'https://myanmar.aspect.id',
  })

  // -------------------------

  const [myanmarCountry] = await knex('Country as c').where({ 'c.a3': 'MMR' }).select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography').where({ countryId }).whereNull('stateId', 'lgaId').first()

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
  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Myanmar Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId: myanmarGeographyId,
    culture: myanmarCountry.culture,
    timezone: myanmarCountry.timezone,
    ...auditFields,
  })

  await upsertJobFunctionFixture(knex, jobFunctionsFixtureMyanmar, partnerId)
  const [jobFunctionIdSuperAdmin] = await knex('JobFunction').where({ externalId: 'superAdmin', partnerId }).pluck('id')
  const [jobFunctionIdLabUser] = await knex('JobFunction').where({ externalId: 'labUser', partnerId }).pluck('id')
  const [jobFunctionIdRegionalOfficer] = await knex('JobFunction')
    .where({ externalId: 'regionalOfficer', partnerId })
    .pluck('id')

  const jobFunctionIds = {
    jobFunctionIdSuperAdmin,
    jobFunctionIdLabUser,
    jobFunctionIdRegionalOfficer,
  }
  const baseProps = {
    partnerId,
    jobFunctionIds,
    auditFields,
    issueTypeWhitelist: ['DeviceMaintenance', 'ModuleReplaced'],
  }

  // Admin Job
  await knex('JobContext').insert({
    personId: adminPersonId,
    jobFunctionId: jobFunctionIdSuperAdmin,
    geographyId: myanmarGeographyId,
  })

  // Regional Officer Jobs and Targets
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
      const [regionPersonId] = await knex('Person').insert({
        userId: regionUserId,
        name: `Myanmar Regional Officer ${region}`,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId: myanmarGeographyId,
        culture: myanmarCountry.culture,
        timezone: myanmarCountry.timezone,
        ...auditFields,
      })
      await knex('JobContext').insert({
        personId: regionPersonId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        geographyId: regionId,
      })
    })
  )

  // every clinic has a site, GxAlert device and MTB/Rif+ and Ultra results
  const {
    Detected: resultCategoryDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    Indeterminate: resultCategoryIndeterminateId,
    Invalid: resultCategoryInvalidId,
    Error: resultCategoryErrorId,
  } = await allResultCategoryToId()

  const resultWorkflowStatusId = await resultWorkflowStatusToId('Ordered')
  const resultSourceId = await resultSourceToId('DiagnosticDevice')
  const resultTypeId = await resultTypeToId('Patient')

  const possibleResults = [
    {
      resultText: 'MTB Detected|Rif Resistance Not Detected',
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      minLikelihood: 0,
      maxLikelihood: 20,
    },
    {
      resultText: 'MTB Detected|Rif Resistance Detected',
      category1: resultCategoryDetectedId,
      category2: resultCategoryDetectedId,
      minLikelihood: 21,
      maxLikelihood: 26,
    },
    {
      resultText: 'MTB Detected|Rif Indeterminate',
      category1: resultCategoryDetectedId,
      category2: resultCategoryIndeterminateId,
      minLikelihood: 27,
      maxLikelihood: 28,
    },
    {
      resultText: 'ERROR',
      category1: resultCategoryErrorId,
      category2: null,
      minLikelihood: 29,
      maxLikelihood: 34,
    },
    {
      resultText: 'Invalid',
      category1: resultCategoryInvalidId,
      category2: null,
      minLikelihood: 35,
      maxLikelihood: 38,
    },
    {
      resultText: 'Not Detected',
      category1: resultCategoryNotDetectedId,
      category2: null,
      minLikelihood: 39,
      maxLikelihood: 100,
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

  const siteDatas = []
  await Promise.all(
    _.map(myanmarSites.sites, async site => {
      const { id: siteGeographyId } = await knex('Geography')
        .where({
          countryId,
          stateId: (statesByAbbreviation[site.stateAbbreviation] || { id: null }).id,
          lgaId: (lgasByName[site.lgaName] || { id: null }).id,
        })
        .first()

      // sites
      const siteData = {
        partnerId,
        geographyId: siteGeographyId,
        name: site.name,
        shortName: site.shortName,
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
        ...auditFields,
      }
      const [siteId] = await insertSite(knex, siteData)
      siteData.id = siteId
      siteDatas.push(siteData)

      // only create results if in managed regions
      const sampleTypeDBSId = await sampleTypeToId('DBS')
      const samples = []
      await Promise.all(
        _.map(_.range(500), async i => {
          const sample = {
            externalId: `SMP-TB-${i}`,
            collectedOn: calculateDateForResult(i, 500, millisInMinute),
            sampleTypeId: sampleTypeDBSId,
            originSiteId: siteData.id,
          }

            ;[sample.id] = await knex('Sample').insert(sample)
          samples.push(sample)
        })
      )

      await Promise.all(
        _.map(site.devices, async deviceSeed => {
          const device = {
            partnerId,
            siteId,
            defaultReportableSiteId: siteId,
            deviceTypeId: deviceTypes.CepheidGeneXpert.id,
            deviceApprovalId: await deviceApprovalToId('approved'),
            name: deviceSeed.name,
            shortName: deviceSeed.shortName,
            macAddress: deviceSeed.macAddress,
            serial: deviceSeed.serial,
            hostId: deviceSeed.hostId,
            culture: deviceSeed.culture,
            timezone: deviceSeed.timezone,
            notes: deviceSeed.notes,
            lastSeenOn: now,
            putInService: subMonths(now, 2),
          }
          const [deviceId] = await knex('Device').insert(device)
          device.id = deviceId

          // only create results if managed region
          await Promise.all(
            _.map(_.range(resultMtbNumber), async i => {
              const sample = samples[i % samples.length]
              let randomDate = calculateDateForResult(i, resultMtbNumber, 6000)

              // Leave some devices as being quiet, with results, for a while
              if (deviceId % 3 === 0 && Math.abs(differenceInDays(now, randomDate)) < maxDaysDeviceNoResults + 3) {
                randomDate = subDays(randomDate, maxDaysDeviceNoResults + 3)
              }
              const instrumentSerial = helpers.generateInstrumentSerial(device.id)
              const module = helpers.generateModules(device.id, instrumentSerial)[i % 4]

              const rnd = _.random(0, 100)
              const result = _.find(possibleResults, r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood)

              resultData.resultText = result.resultText
              const [rid] = await knex('Result').insert({
                ...auditFields,
                externalId: `UQTB-${i}`,
                assayId: assays.GxMtbRif.id,
                partnerId,
                siteId: siteData.id,
                deviceId: device.id,
                longitude: siteData.latitude,
                latitude: siteData.longitude,
                resultSourceId,
                resultTypeId,
                sampleId: sample.id,
                reportableSiteId: sample.originSiteId || siteData.id,
                sampleRunNumber: `${(i % 2) + 1}`,
                sampleGroup: `GRP-TB-${i % 5}`,
                resultCategory1: result.category1,
                resultCategory2: result.category2,
                resultData: JSON.stringify({ ...resultData, assay: 'Xpert MTB-RIF Assay G4' }),
                assayVersion: '4',
                startedOn: randomDate,
                endedOn: addMinutes(randomDate, 100),
                createdOn: addMinutes(randomDate, 120),
                updatedOn: addMinutes(randomDate, 180),
                consumableSerial: `${i}12`,
                consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
                consumableLot: `Lot ${i % 5}`,
                instrumentSerial,
                moduleName: module.name,
                moduleSerial: module.serial,
                researchId: `R-ID-${i}`,
                patientData: JSON.stringify(patients[_.random(99)]),
                senderVersion: '4.6b',
                senderOperator: 'Marsha',
                notes: 'This is a test... result',
                errorCode: result.category1 === resultCategoryErrorId ? errorCodes[_.random(errorCodes.length)] : null,
                errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null,
              })
              const [lastLogId] = await knex('ResultWorkflowLog').insert({
                resultId: rid,
                resultWorkflowStatusId,
                changedOn: now,
                createdOn: now,
                createdBy: adminId,
              })
              await knex('Result').where('id', rid).update({ resultWorkflowStatusLogId: lastLogId })
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
      const [labPersonId] = await knex('Person').insert({
        userId: labUserId,
        name: `Myanmar Lab User ${region}`,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId,
        culture: myanmarCountry.culture,
        timezone: myanmarCountry.timezone,
        canLogIn: true,
        ...auditFields,
      })
      await knex('JobContext').insert({
        personId: labPersonId,
        jobFunctionId: jobFunctionIdLabUser,
        siteId,
      })
    })
  )

  await addIssueTypes(knex, partnerId, adminId, null)
  // Notification Types
  await seedNotificationTypes(knex, baseProps)

  // TB Cartridges Consumable Id
  const { id: consumableGxTbCartridgeId } = await knex('Consumable')
    .where({ name: 'GeneXpert TB Cartridge' })
    .first('id')
  // Insert Inventory Items
  await Promise.all(
    _.map(_.range(siteDatas.length), async i => {
      const siteData = siteDatas[i]
      const siteId = siteData.id
      // TB Cartridges
      if (siteId % 2 === 0) {
        await knex('InventoryItem').insert({
          consumableId: consumableGxTbCartridgeId,
          siteId,
          quantityOnHand: _.random(0, 1000),
          ...auditFields,
        })
      }
    })
  )

  // Fill Issue/AlertMessage/Notification table with some mock data
  const devices = await knex('Device').where({ partnerId })

  const issueStatusActiveId = await getId(knex, 'IssueStatus', 'Active')
  const issueStatusAcknowledgedId = await getId(knex, 'IssueStatus', 'Acknowledged')
  const issueStatusOkId = await getId(knex, 'IssueStatus', 'OK')
  const messageStatusSentId = await getId(knex, 'MessageStatus', 'Sent')

  const issue = {
    level: 1,
    partnerId,
    createdOn: now,
    updatedOn: now,
  }
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  let issueIds = []
  const luIssueTypeIds = [
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleFailureError.id,
    issueTypes.ModuleTemperatureError.id,
    issueTypes.ModulePowerError.id,
    issueTypes.MachineTemperatureError.id,
    issueTypes.MachinePowerError.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.DataCategoryLowError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.ReagentHealthError.id,
  ]

  const luAlertMessages = {
    [issueTypes.DeviceOffline.id]: 'Cannot reach network for 12 days',
    [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
    [issueTypes.ModuleFailureError.id]: 'Module A1: Critical errors; notify R.O.',
    [issueTypes.ModuleTemperatureError.id]: 'Temperature errors on Module A2; notify R.O.',
    [issueTypes.ModulePowerError.id]: 'Power errors on Module A3; notify RO',
    [issueTypes.MachineTemperatureError.id]: 'Temperature errors across machine, conduct troubleshooting',
    [issueTypes.MachinePowerError.id]: 'Power errors across machine, conduct troubleshooting',
    [issueTypes.ModuleProceduralError.id]: 'Module A2 errors, conduct troubleshooting',
    [issueTypes.MachineProceduralError.id]: 'Procedural errors across machine, conduct troubleshooting',
    [issueTypes.DataCategoryLowError.id]: 'HIV Status collection rate 89%',
    [issueTypes.StockLevelUpdate.id]: 'Stock Level',
    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
  }

  const deviceIds = await knex('Device as d')
    .select('jc.personId', 'd.id as deviceId')
    .join('JobContext as jc', 'jc.siteId', 'd.siteId')
    .where({ jobFunctionId: jobFunctionIdLabUser })
    .union(function () {
      this.select('jc.personId', 'd.id as deviceId')
        .from('Device as d')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .leftJoin('Geography as g1', 's.geographyId', 'g1.id')
        .leftJoin('Geography as g2', 'g2.stateId', 'g1.stateId')
        .join('JobContext as jc', 'jc.geographyId', 'g2.id')
        .where({ 'd.partnerId': partnerId, jobFunctionId: jobFunctionIdRegionalOfficer })
    })
    .then(items =>
      _.orderBy(items, ['deviceId']).reduce((memo, row) => {
        if (!memo[row.deviceId]) {
          memo[row.deviceId] = {}
        }
        memo[row.deviceId][row.personId] = row.deviceId
        return memo
      }, {})
    )

  await Promise.all(
    _.map(devices, async device => {
      await Promise.all(
        _.map(luIssueTypeIds, async issueTypeId => {
          const issueStatusId = issueTypeId === issueTypes.StockLevelUpdate.id ? issueStatusOkId : issueStatusActiveId
          const [issueId] = await knex('Issue').insert({
            issueTypeId,
            issueStatusId,
            deviceId: issueTypes.StockLevelUpdate.id === issueTypeId ? null : device.id,
            siteId: device.siteId,
            geographyId: device.geographyId,
            ...issue,
          })
          if (issueStatusId === issueStatusAcknowledgedId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId: issueStatusActiveId,
              changedOn: now,
              createdOn: now,
              createdBy: adminId,
            })
          }
          if (issueStatusId !== issueStatusActiveId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId,
              changedOn: new Date(+now + millisInHour),
              createdOn: new Date(+now + millisInHour - 1000),
              createdBy: adminId,
            })
          }
          issueIds.push(issueId)
        })
      )
    })
  )

  const luPolicies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('JobContext as jc', 'jc.jobFunctionId', 'nt.jobFunctionId')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': partnerId })
    .whereIn('i.id', issueIds)
    .where('nt.level', 1)
    .where('nt.jobFunctionId', jobFunctionIdLabUser)
    .select(
      'nt.id as notificationTypeId',
      'nt.jobFunctionId',
      'jc.personId',
      'i.id as issueId',
      'i.issueTypeId',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'mt.alertTemplateId'
    )

  await Promise.all(
    _.map(luPolicies, async policy => {
      const deviceId = _.get(deviceIds, ['policy.deviceId', 'policy.personId'])
      if (deviceId) {
        const [alertMessageId] = await knex('AlertMessage').insert({
          messageStatusId: messageStatusSentId,
          message: luAlertMessages[policy.issueTypeId],
          createdOn: now,
          updatedOn: now,
          ..._.pick(policy, ['alertTemplateId', 'personId', 'siteId', 'deviceId', 'resultId']),
        })

        await knex('Notification').insert({
          createdOn: now,
          alertMessageId,
          ..._.pick(policy, ['notificationTypeId', 'issueId', 'personId']),
        })
      }
    })
  )

  // add issues for RO
  const roIssueTypeIds = [
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.DataCategoryLowError.id,
    issueTypes.ReagentHealthError.id,
  ]

  const roAlertMessages = {
    [issueTypes.DeviceOffline.id]: 'No contact for 12 days. If there is a reason for being inactive, add the reason',
    [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
    [issueTypes.ModuleProceduralError.id]: 'Module Temperature Issue for 2 days',
    [issueTypes.MachineProceduralError.id]: 'Machine Power Issue for 7 days',
    [issueTypes.StockLevelUpdate.id]: 'Stock Level',
    [issueTypes.DataCategoryLowError.id]: 'HIV Status collection rate 92%',
    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
  }

  issue.level = 2
  issueIds = []
  await Promise.all(
    _.map(devices, async device => {
      await Promise.all(
        _.map(roIssueTypeIds, async issueTypeId => {
          const issueStatusId = issueTypeId === issueTypes.StockLevelUpdate.id ? issueStatusOkId : issueStatusActiveId
          const [issueId] = await knex('Issue').insert({
            issueTypeId,
            issueStatusId,
            deviceId: issueTypes.StockLevelUpdate.id === issueTypeId ? null : device.id,
            siteId: device.siteId,
            geographyId: device.geographyId,
            ...issue,
          })
          if (issueStatusId === issueStatusAcknowledgedId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId: issueStatusActiveId,
              changedOn: now,
              createdOn: now,
              createdBy: adminId,
            })
          }
          if (issueStatusId !== issueStatusActiveId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId,
              changedOn: new Date(+now + millisInHour),
              createdOn: new Date(+now + millisInHour - 1000),
              createdBy: adminId,
            })
          }
          issueIds.push(issueId)
        })
      )
    })
  )

  const roPolicies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('JobContext as jc', 'jc.jobFunctionId', 'nt.jobFunctionId')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': partnerId })
    .whereIn('i.id', issueIds)
    .whereRaw('(nt.level < 3 or nt.issueTypeId = ?)', [issueTypes.ReagentHealthError.id])
    .where('nt.jobFunctionId', jobFunctionIdRegionalOfficer)
    .select(
      'nt.id as notificationTypeId',
      'nt.name as notificationTypeName',
      'nt.jobFunctionId',
      'jc.personId',
      'i.id as issueId',
      'i.issueTypeId',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'mt.alertTemplateId'
    )

  await Promise.all(
    _.map(roPolicies, async policy => {
      const deviceId = _.get(deviceIds, ['policy.deviceId', 'policy.personId'])
      if (deviceId) {
        const message = policy.notificationTypeName.endsWith('RO View')
          ? luAlertMessages[policy.issueTypeId]
          : roAlertMessages[policy.issueTypeId]
        const [alertMessageId] = await knex('AlertMessage').insert({
          messageStatusId: messageStatusSentId,
          message,
          createdOn: now,
          updatedOn: now,
          ..._.pick(policy, ['alertTemplateId', 'personId', 'siteId', 'deviceId', 'resultId']),
        })

        await knex('Notification').insert({
          createdOn: now,
          alertMessageId,
          ..._.pick(policy, ['notificationTypeId', 'issueId', 'personId']),
        })
      }
    })
  )

  await seedIssues(knex, baseProps)
}

function calculateDateForResult(currentResult, totalResults, randomMillisToAdd) {
  const daysToSubtract = resultTimeFrameInDays - Math.ceil((currentResult / totalResults) * resultTimeFrameInDays)

  return addMilliseconds(subDays(now, daysToSubtract), _.random(randomMillisToAdd))
}

async function getId(knex, table, externalId) {
  const { id } = await knex(table).where({ externalId }).first('id')
  return id
}
