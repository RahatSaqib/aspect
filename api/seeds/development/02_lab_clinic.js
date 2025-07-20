/* eslint no-await-in-loop: 0 */
module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const _ = require('lodash')
const Promise = require('bluebird')
const { addMilliseconds, addHours, addMinutes, subDays, subHours, subMinutes, subMonths } = require('date-fns')
const { insertSite } = require('../../src/site/common/db')
const helpers = require('./fixtures/helpers')
const { upsertJobFunctionFixture } = require('../common')
const patients = require('./fixtures/patients.json')
const config = require('../../src/config')
const { randomToken } = require('../../src/deviceApi/apiKey')
const labClinic = require('./fixtures/labClinic.json')
const {
  allResultCategoryToId,
  allResultWorkflowStatusToId,
  assayTypeToId,
  partnerTypeToId,
  deviceTypeToId,
  deviceTypeCategoryToId,
  deviceApprovalToId,
  resultSourceToId,
  resultTypeToId,
  siteTypeToId,
} = require('../../src/shared/dictionary')
const jobFunctionsFixtureReporter = require('./fixtures/jobFunctions_reporter')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 180
const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultEidNumber = 0.2 * resultMultiplier
const resultHivVlNumber = resultMultiplier
const now = new Date()
const patientNumber = patients.length - 1

function calculateDateForResult(currentResult, totalResults, randomMillisToAdd) {
  const daysToSubtract = resultTimeFrameInDays - Math.ceil((currentResult / totalResults) * resultTimeFrameInDays)

  return addMilliseconds(subDays(now, daysToSubtract), _.random(randomMillisToAdd))
}

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User').where({ name: 'reporter_admin' }).first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: 'reporter_admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: subMonths(now, 30),
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [partnerId] = await knex('Partner').insert({
    name: 'Reporter',
    externalId: 'reporter',
    partnerTypeId: await partnerTypeToId('operating'),
    plugin: 'malawi',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  // Reporter Device Type
  const [deviceTypeIdReporter] = await knex('DeviceType').insert({
    externalId: 'AspectReporter',
    name: 'Aspect Reporter',
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: await deviceTypeCategoryToId('Client'),
  })

  const resultSourceGeneratedId = await resultSourceToId('Generated')

  await knex('Assay').insert({
    name: 'Reporter HIV VL',
    abbreviation: 'Reporter HIV VL',
    i18nKey: 'AssayReporterHivVl',
    externalId: 'ReporterHivVL',
    assayTypeId: await assayTypeToId('HIV VL'),
    deviceTypeId: deviceTypeIdReporter,
    resultSourceId: resultSourceGeneratedId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result',
        type: 'string',
      },
      interpretation: {
        title: 'Interpretation',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      artNumber: {
        title: 'ART #',
        type: 'string',
        order: 4,
      },
      age: {
        title: 'Age (months)',
        type: 'string',
        order: 3,
      },
      dateOfBirth: {
        title: 'Date of Birth',
        type: 'string',
        order: 4,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5,
      },
      provider: {
        title: 'Provider',
        type: 'string',
        order: 7,
      },
      phone: {
        title: 'Phone #',
        type: 'string',
        order: 8,
      },
    }),
  })

  await knex('Assay').insert({
    name: 'Reporter EID',
    abbreviation: 'Reporter EID',
    i18nKey: 'AssayReporterEid',
    externalId: 'ReporterEID',
    assayTypeId: await assayTypeToId('EID'),
    deviceTypeId: deviceTypeIdReporter,
    resultSourceId: resultSourceGeneratedId,
    resultCategory1Label: 'EID',
    resultCategory1i18nKey: 'resultCategoryEid',
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result',
        type: 'string',
      },
      interpretation: {
        title: 'Interpretation',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      age: {
        title: 'Age (months)',
        type: 'string',
        order: 3,
      },
      dateOfBirth: {
        title: 'Date of Birth',
        type: 'string',
        order: 4,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5,
      },
      hccNumber: {
        title: 'HCC #',
        type: 'string',
        order: 6,
      },
      motherName: {
        title: 'Mother Name',
        type: 'string',
        order: 7,
      },
      motherSurname: {
        title: 'Mother Surname',
        type: 'string',
        order: 8,
      },
      phone: {
        title: 'Phone #',
        type: 'string',
        order: 9,
      },
    }),
  })

  // Create clinics for every state in Malawi
  const [malawiCountry] = await knex('Country as c').where({ 'c.a3': 'MWI' }).select('c.id', 'c.culture', 'c.timezone')

  const malawiStates = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': malawiCountry.id })
    .select('g.countryId', 's.id', 's.name')

  const { culture, timezone, id: countryId } = malawiCountry

  const { id: geographyId } = await knex('Geography').where({ countryId }).first()

  // Permissions for Reporter Admin
  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Reporter Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone,
    canLogIn: true,
    ...auditFields,
  })

  await upsertJobFunctionFixture(knex, jobFunctionsFixtureReporter, partnerId)
  const [jobFunctionIdSuperAdmin] = await knex('JobFunction').where({ externalId: 'superAdmin', partnerId }).pluck('id')
  const [jobFunctionIdLabAdmin] = await knex('JobFunction').where({ externalId: 'labAdmin', partnerId }).pluck('id')

  await knex('JobContext').insert({ personId: adminPersonId, jobFunctionId: jobFunctionIdSuperAdmin, geographyId })

  const statesByName = malawiStates.reduce((memo, state) => {
    memo[state.name.toLowerCase()] = state
    return memo
  }, {})

  const { id: deviceTypeIdRouter } = await knex('DeviceType').where({ externalId: 'MetacomRouter' }).first()

  const approvedDeviceApprovalId = await deviceApprovalToId('approved')

  const clinicSiteTypeId = await siteTypeToId('clinic')
  // every clinic has a site and a Reporter device
  await Promise.all(
    _.map(labClinic.clinics, async clinic => {
      const { id: clinicGeographyId } = await knex('Geography')
        .where({
          countryId,
          stateId: (statesByName[clinic.stateName.toLowerCase()] || { id: null }).id,
        })
        .first()

      // sites
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
      const [siteId] = await insertSite(knex, siteData)
      siteData.id = siteId

      const lastTime = subMinutes(now, _.random(0, 60))

      if (clinic.hasReporter) {
        const [deviceId] = await knex('Device').insert({
          partnerId,
          siteId,
          defaultReportableSiteId: siteId,
          deviceTypeId: deviceTypeIdReporter,
          deviceApprovalId: approvedDeviceApprovalId,
          name: `${siteData.name} Reporter`,
          shortName: `${siteData.city || siteData.name} Reporter`,
          serial: `S1-R-${_.random(100000, 999999)}`,
          lastSeenOn: lastTime,
          lastPingOn: lastTime,
          lastPingFromIp: '41.70.127.33',
          putInService: subMonths(now, 22),
          putInServiceSource: 'Installed at clinic',
          configurationData: '{}',
          ...auditFields,
        })

        await knex('DeviceApiKey').insert({
          token:
            clinic.name === 'Mponela Rural Hospital' // this is the reporter demo site - keep API key  static
              ? 'g39ypz0725x1cubf0vq3'
              : randomToken(),
          revoked: 0,
          partnerId,
          geographyId,
          siteId,
          deviceId,
          ...auditFields,
        })

        // Router
        await knex('Device').insert({
          ...auditFields,
          name: `${siteData.name} Router`,
          shortName: `RO-${siteData.shortName}`,
          deviceTypeId: deviceTypeIdRouter,
          deviceApprovalId: approvedDeviceApprovalId,
          partnerId: siteData.partnerId,
          siteId: siteData.id,
          lastSeenOn: lastTime,
          lastPingOn: lastTime,
          lastPingFromIp: '41.70.127.33',
          putInService: subMonths(now, 2),
        })
      }
    })
  )

  const labSiteTypeId = await siteTypeToId('lab')
  // Labs have m2000 and modem
  await Promise.all(
    _.map(labClinic.labs, async lab => {
      // every lab has a site, m2000 device and a user assigned to it
      const siteData = {
        partnerId,
        geographyId,
        name: lab.name,
        shortName: lab.shortName,
        externalId: lab.externalId,
        latitude: lab.latitude,
        longitude: lab.longitude,
        siteTypeId: labSiteTypeId,
        ...auditFields,
      }
      const [siteId] = await insertSite(knex, siteData)
      siteData.id = siteId

      // create lab admin user with permission to view data to own lab
      const [labAdminUserId] = await knex('User').insert({
        name: `reporter_${lab.externalId.toLowerCase()}`,
        password: bcrypt.hashSync('test07', saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0,
      })

      const [labAdminPersonId] = await knex('Person').insert({
        userId: labAdminUserId,
        name: `${lab.shortName} Admin`,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId,
        culture,
        timezone,
        ...auditFields,
      })

      await knex('JobContext').insert({ personId: labAdminPersonId, jobFunctionId: jobFunctionIdLabAdmin, siteId })

      if (lab.devices) {
        await Promise.all(
          _.map(lab.devices, async device => {
            const deviceApiKeyToken = device.deviceApiKey || randomToken()
            const deviceData =
              (await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.deviceId', 'd.id')
                .where('dak.token', deviceApiKeyToken)
                .first('d.*')) || {}
            if (_.isEmpty(deviceData)) {
              const lastDeviceActivity = subMinutes(now, _.random(0, 60))
              deviceData.partnerId = partnerId
              deviceData.siteId = siteData.id
              deviceData.defaultReportableSiteId = siteData.id
              deviceData.deviceApprovalId = approvedDeviceApprovalId
              deviceData.name = device.name
              deviceData.shortName = device.shortName
              deviceData.macAddress = device.macAddress
              deviceData.serial = device.deviceSerial
              deviceData.hostId = device.hostId
              deviceData.lastSeenOn = lastDeviceActivity
              deviceData.lastPingOn = lastDeviceActivity
              deviceData.lastPingFromIp = `61.30.120.${Math.floor(Math.random() * 255)}`
              deviceData.putInService = subMonths(now, 30)
              deviceData.putInServiceSource = 'Installed at lab'
              deviceData.configurationData = '{}'
              const { id: deviceTypeId } =
                (await knex('DeviceType').where('externalId', device.deviceTypeId).first('id')) || {}
              const [deviceId] = await knex('Device').insert({
                ...deviceData,
                deviceTypeId,
                ...auditFields,
              })
              deviceData.id = deviceId
              await knex('DeviceApiKey').insert({
                token: deviceApiKeyToken,
                revoked: 0,
                partnerId,
                geographyId,
                siteId,
                deviceId,
                ...auditFields,
              })
            }
          })
        )
        const routerData =
          (await knex('Device')
            .where({
              shortName: `RO-${siteData.shortName}`,
              deviceTypeId: deviceTypeIdRouter,
              siteId: siteData.id,
              partnerId: siteData.partnerId,
            })
            .first()) || {}
        if (_.isEmpty(routerData)) {
          const lastRouterActivity = subMinutes(now, _.random(0, 60))
          routerData.name = `Router at ${siteData.name}`
          routerData.shortName = `RO-${siteData.shortName}`
          routerData.deviceTypeId = deviceTypeIdRouter
          routerData.deviceApprovalId = approvedDeviceApprovalId
          routerData.partnerId = siteData.partnerId
          routerData.siteId = siteData.id
          routerData.lastSeenOn = lastRouterActivity
          routerData.lastPingOn = lastRouterActivity
          routerData.lastPingFromIp = `91.25.123.${Math.floor(Math.random() * 255)}`
          routerData.putInService = subMonths(now, 2)
          await knex('Device').insert({
            ...routerData,
            ...auditFields,
          })
        }
      }
    })
  )

  // EID Results and samples
  const { id: sampleTypeDBSId } = await knex('SampleType').where('externalId', 'DBS').select('id')

  const clinicsWithReporters = _.filter(labClinic.clinics, {
    hasReporter: true,
  })

  let samples = []

  async function createUniqueSampleIdForSite(prefix, siteId) {
    const randomId = prefix ? `${prefix}-${_.random(200000, 888888)}` : _.random(200000, 888888).toString()
    const existingSamplesWithId = await knex('Sample as s').where('externalId', randomId).select()
    if ((siteId && _.some(existingSamplesWithId, { originSiteId: siteId })) || !_.isEmpty(existingSamplesWithId)) {
      return createUniqueSampleIdForSite(prefix, siteId)
    }
    return randomId
  }

  async function createSampleEid(i) {
    const clinic = clinicsWithReporters[i % clinicsWithReporters.length]

    const { id: siteId } = await knex('Site').where('externalId', clinic.externalId).first()

    const externalId = await createUniqueSampleIdForSite('PREID', siteId)
    const sample = {
      externalId,
      collectedOn: calculateDateForResult(i, resultEidNumber, millisInMinute),
      sampleTypeId: sampleTypeDBSId,
      originSiteId: siteId,
    }

      ;[sample.id] = await knex('Sample').insert(sample)

    samples.push(sample)
  }

  for (const i of _.range(resultEidNumber / 2)) {
    await createSampleEid(i)
  }

  // Results section
  const {
    Detected: resultCategoryDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    Indeterminate: resultCategoryIndeterminateId,
    Error: resultCategoryErrorId,
    LessThan1000: resultCategoryLessThan1000Id,
    MoreThan1000: resultCategoryMoreThan1000Id,
    CollectNewSample: resultCategoryCollectNewSampleId,
  } = await allResultCategoryToId()

  // Reuse previously seeded "static" data
  const { id: assayIdEid } = await knex('Assay').where('externalId', 'abbottM2000HIVEID').first()

  const { id: assayIdHivVl } = await knex('Assay').where('externalId', 'abbottM2000DBSHivVL').first()

  const { Validated: validated, Deliverable: deliverable } = await allResultWorkflowStatusToId()

  const resultSourceLimsId = await resultSourceToId('LIMS')

  const resultTypePatientId = await resultTypeToId('Patient')

  const possibleResultsEid = [
    {
      resultText: 'Negative',
      category1: resultCategoryNotDetectedId,
      minLikelihood: 0,
      maxLikelihood: 82,
    },
    {
      resultText: 'Positive',
      category1: resultCategoryDetectedId,
      minLikelihood: 83,
      maxLikelihood: 92,
    },
    {
      resultText: 'Indeterminate',
      category1: resultCategoryIndeterminateId,
      minLikelihood: 93,
      maxLikelihood: 96,
    },
    {
      resultText: 'Error',
      category1: resultCategoryErrorId,
      minLikelihood: 97,
      maxLikelihood: 100,
    },
  ]

  const deviceTypeAbbottM2000 = await deviceTypeToId('AbbottM2000')
  const m2000Devices = await knex('Device').where('deviceTypeId', deviceTypeAbbottM2000).select('id', 'siteId')

  async function createUniqueResultIdForDevice(candidateId, deviceId, tryNumber) {
    const existingResultsWithId = await knex('Result as r')
      .where('externalId', tryNumber ? `${candidateId}-${tryNumber}` : candidateId)
      .select()
    if ((deviceId && _.some(existingResultsWithId, { deviceId })) || !_.isEmpty(existingResultsWithId)) {
      return createUniqueResultIdForDevice(candidateId, deviceId, (tryNumber || 0) + 1)
    }
    return tryNumber ? `${candidateId}-${tryNumber}` : candidateId
  }

  async function createResultEid(i) {
    const device = m2000Devices[i % m2000Devices.length]
    const siteData = await knex('Site').where('id', device.siteId).first('id', 'geographyId')
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultEidNumber, 6000)

    const instrumentSerial = helpers.generateInstrumentSerial(device.id)
    const module = helpers.generateModules(device.id, instrumentSerial)[i % 4]

    const rnd = _.random(0, 100)
    const result = _.find(possibleResultsEid, r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood)
    const patient = patients[_.random(patientNumber)]
    const resultData = { resultText: result.resultText }
    const resultExternalId = await createUniqueResultIdForDevice(sample.externalId, device.id)

    const [resultId] = await knex('Result').insert({
      ...auditFields,
      externalId: resultExternalId,
      assayId: assayIdEid,
      partnerId,
      siteId: siteData.id,
      deviceId: device.id,
      longitude: -33.78725,
      latitude: -13.96692,
      resultSourceId: resultSourceLimsId,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      sampleGroup: sample.externalId.substring(0, 10),
      resultCategory1: result.category1,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: randomDate,
      endedOn: addMinutes(randomDate, 100),
      createdOn: addMinutes(randomDate, 120),
      updatedOn: addMinutes(randomDate, 180),
      researchId: `R-ID-${i}`,
      instrumentSerial,
      moduleName: module.name,
      moduleSerial: module.serial,
      senderOperator: 'Frank',
      errorCode: result.category1 === resultCategoryErrorId ? _.random(2000, 9000) : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Temperature out of acceptable range' : null,
      reportableSiteId: sample.originSiteId || siteData.id,
      patientData: JSON.stringify({
        id: patient.id,
        age: patient.age,
        name: patient.firstName,
        phone: patient.phone,
        gender: patient.gender ? patient.gender.substring(0, 1) : null,
        surname: patient.lastName,
        provider: patient.providerId,
        hccNumber: patient.artHccNumber,
        motherName: patient.motherName,
        dateOfBirth: patient.dob,
        motherSurname: patient.lastName,
        eidRegistrationNumber: patient.artHccNumber,
      }),
    })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: validated,
      changedOn: subHours(randomDate, 25),
      createdOn: subHours(randomDate, 26),
      createdBy: adminId,
    })

    const [lastLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: deliverable,
      changedOn: addHours(randomDate, 2),
      createdOn: addHours(randomDate, 1),
      createdBy: adminId,
    })
    await knex('Result').where('id', resultId).update({ resultWorkflowStatusLogId: lastLogId })
  }

  for (const i of _.range(resultEidNumber)) {
    await createResultEid(i)
  }

  const possibleResultsHivVl = [
    {
      resultText: '<839 Copies / mL',
      category1: resultCategoryLessThan1000Id,
      minLikelihood: 0,
      maxLikelihood: 15,
    },
    {
      resultText: 'X Copies / mL',
      category1: resultCategoryLessThan1000Id,
      minLikelihood: 16,
      maxLikelihood: 25,
    },
    {
      resultText: 'X Copies / mL',
      category1: resultCategoryMoreThan1000Id,
      minLikelihood: 26,
      maxLikelihood: 75,
    },
    {
      resultText: 'Collect New Sample',
      category1: resultCategoryCollectNewSampleId,
      minLikelihood: 76,
      maxLikelihood: 90,
    },
    {
      resultText: 'Failed',
      category1: resultCategoryErrorId,
      minLikelihood: 91,
      maxLikelihood: 100,
    },
  ]

  samples = []

  async function createSampleHiv(i) {
    const clinic = clinicsWithReporters[i % clinicsWithReporters.length]

    const { id: siteId } = await knex('Site').where('externalId', clinic.externalId).first()

    const externalId = await createUniqueSampleIdForSite('PRHIVVL', siteId)
    const sample = {
      externalId,
      collectedOn: calculateDateForResult(i, resultHivVlNumber, millisInMinute),
      sampleTypeId: sampleTypeDBSId,
      originSiteId: siteId,
    }

      ;[sample.id] = await knex('Sample').insert(sample)

    samples.push(sample)
  }

  for (const i of _.range(resultHivVlNumber / 2)) {
    await createSampleHiv(i)
  }

  async function createResultHiv(i) {
    const device = m2000Devices[i % m2000Devices.length]
    const siteData = await knex('Site').where('id', device.siteId).first('id', 'geographyId')
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

    const rnd = _.random(0, 100)
    const result = _.find(possibleResultsHivVl, r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood)
    const patient = patients[_.random(patientNumber)]

    let copies = null
    if (result.resultText.indexOf('X Copies') !== -1) {
      if (result.category1 === resultCategoryLessThan1000Id) {
        copies = _.random(839, 999)
      } else if (result.category1 === resultCategoryMoreThan1000Id) {
        copies = _.random(1000, 2000000)
      }
    }

    const instrumentSerial = helpers.generateInstrumentSerial(device.id)
    const module = helpers.generateModules(device.id, instrumentSerial)[i % 4]

    const resultData = {
      resultText: copies ? result.resultText.replace('X', copies) : result.resultText,
    }
    const resultExternalId = await createUniqueResultIdForDevice(sample.externalId, device.id)
    const [resultId] = await knex('Result').insert({
      ...auditFields,
      externalId: resultExternalId,
      assayId: assayIdHivVl,
      partnerId,
      siteId: siteData.id,
      reportableSiteId: sample.originSiteId || siteData.id,
      deviceId: device.id,
      longitude: -33.78725,
      latitude: -13.96692,
      resultSourceId: resultSourceLimsId,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      sampleGroup: sample.externalId.substring(0, 10),
      resultCategory1: result.category1,
      resultData: JSON.stringify({ ...resultData, assay: 'Xpert_HIV-1 Viral Load' }),
      assayVersion: '3',
      startedOn: randomDate,
      endedOn: addMinutes(randomDate, 100),
      createdOn: addMinutes(randomDate, 120),
      updatedOn: addMinutes(randomDate, 180),
      researchId: `R-ID-${i}`,
      instrumentSerial,
      moduleName: module.name,
      moduleSerial: module.serial,
      senderOperator: 'Frank',
      errorCode: result.category1 === resultCategoryErrorId ? _.random(2000, 9000) : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Temperature out of acceptable range' : null,
      patientData: JSON.stringify({
        id: patient.id,
        age: patient.age,
        name: patient.firstName,
        phone: patient.phone,
        gender: patient.gender ? patient.gender.substring(0, 1) : null,
        surname: patient.lastName,
        provider: patient.providerId,
        artNumber: patient.artHccNumber,
        dateOfBirth: patient.dob,
      }),
    })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: validated,
      changedOn: subHours(randomDate, 25),
      createdOn: subHours(randomDate, 26),
      createdBy: adminId,
    })

    const [lastLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: deliverable,
      changedOn: addHours(randomDate, 2),
      createdOn: addHours(randomDate, 1),
      createdBy: adminId,
    })
    await knex('Result').where({ id: resultId }).update({ resultWorkflowStatusLogId: lastLogId })
  }

  for (const i of _.range(resultHivVlNumber)) {
    await createResultHiv(i)
  }
}
