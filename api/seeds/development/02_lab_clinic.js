/* eslint no-await-in-loop: 0 */
module.exports = require('../utils').seed(seed)

const bcrypt = require('bcrypt')
const _ = require('lodash')
const {
  addMilliseconds,
  addHours,
  addMinutes,
  subDays,
  subHours,
  subMinutes,
  subMonths,
} = require('date-fns')

const patients = require('./fixtures/patients.json')
const config = require('../../src/config')
const { randomToken } = require('../../src/deviceApi/apiKey')
const labClinic = require('./fixtures/labClinic.json')
const {
  getPermissionModules,
  assignAllFeaturesToJobFunctionIds,
} = require('../utils')
const {
  allResultCategoryToId,
  allResultWorkflowStatusToId,
  assayTypeToId,
  partnerTypeToId,
  deviceTypeCategoryToId,
  resultSourceToId,
  resultTypeToId,
} = require('../../src/shared/dictionary')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 180
const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultEidNumber = 8 * resultMultiplier
const resultHivVlNumber = 70 * resultMultiplier
const now = new Date()
const patientNumber = patients.length - 1

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

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'reporter_admin' })
    .first('id')
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
    partnerTypeId: await partnerTypeToId('Operating'),
    plugin: 'malawi',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  /* TODO Add configuration schema once UI supports and we synchronize correctly
  // define configurationData object
  const reporterConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string'
    },
    adminPassword: {
      title: 'Admin password',
      type: 'string'
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string'
    },
    userPins: {
      title: 'Pins',
      type: 'object',
      i18nKey: 'User Pins',
      properties: {
        user1Pin: {
          title: 'user1Pin',
          type: 'string'
        },
        user1Name: {
          title: 'user1Name',
          type: 'string'
        },
        user1Assays: {
          title: 'user1Assays',
          type: 'array'
        },
        user2Pin: {
          title: 'user2Pin',
          type: 'string'
        },
        user2Name: {
          title: 'user2Name',
          type: 'string'
        },
        user2Assays: {
          title: 'user2Assays',
          type: 'array'
        },
        user3Pin: {
          title: 'user3Pin',
          type: 'string'
        },
        user3Name: {
          title: 'user3Name',
          type: 'string'
        },
        user3Assays: {
          title: 'user3Assays',
          type: 'array'
        },
        user4Pin: {
          title: 'user4Pin',
          type: 'string'
        },
        user4Name: {
          title: 'user4Name',
          type: 'string'
        },
        user4Assays: {
          title: 'user4Assays',
          type: 'array'
        },
        user5Pin: {
          title: 'user5Pin',
          type: 'string'
        },
        user5Name: {
          title: 'user5Name',
          type: 'string'
        },
        user5Assays: {
          title: 'user5Assays',
          type: 'array'
        },
        adminPin: {
          title: 'adminPin',
          type: 'string'
        },
        adminName: {
          title: 'adminName',
          type: 'string'
        },
        adminAssays: {
          title: 'adminAssays',
          type: 'array'
        }
      }
    }
  })
*/

  // Reporter Device Type
  const [deviceTypeIdReporter] = await knex('DeviceType').insert({
    externalId: 'AspectReporter',
    name: 'Aspect Reporter',
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: await deviceTypeCategoryToId('Client'),
    // configurationDataSchema: reporterConfigurationDataSchema
  })

  const resultSourceGeneratedId = await resultSourceToId('Generated')

  await knex('Assay').insert({
    name: 'Reporter HIV VL',
    i18nKey: 'AssayReporterHivVl',
    externalId: 'HivVl',
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
    i18nKey: 'AssayReporterEid',
    externalId: 'EID',
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

  const modules = await getPermissionModules(knex)

  // Create clinics for every state in Malawi
  const [malawiCountry] = await knex('Country as c')
    .where({ 'c.a3': 'MWI' })
    .select('c.id', 'c.culture', 'c.timezone')

  const malawiStates = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': malawiCountry.id })
    .select('g.countryId', 's.id', 's.name')

  const { culture, timezone, id: countryId } = malawiCountry

  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .first()

  // Permissions for Reporter Admin
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Reporter Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId,
        culture,
        timezone,
      },
      auditFields
    )
  )

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })

  const [jobFunctionIdLabAdmin] = await knex('JobFunction').insert({
    name: 'Lab Admin',
    partnerId,
  })

  await assignAllFeaturesToJobFunctionIds(knex, [
    jobFunctionIdLabAdmin,
    jobFunctionIdAdmin,
  ])

  await knex('JobFunctionPermission').insert([
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.result.admin,
    },
    { jobFunctionId: jobFunctionIdLabAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdLabAdmin, permissionId: modules.assay.admin },
    { jobFunctionId: jobFunctionIdLabAdmin, permissionId: modules.browse.view },
  ])

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.notification.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.issue.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.task.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.report.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.browse.view },
  ])

  // add widgets
  const widgets = await knex('DashboardWidget').select('id', 'title')
  await knex('JobFunctionDashboardWidget').insert([
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Results' }).id,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Contacts' }).id,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Devices' }).id,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Sites' }).id,
    },

    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Results' }).id,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Contacts' }).id,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Devices' }).id,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Sites' }).id,
    },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  const statesByName = malawiStates.reduce((memo, state) => {
    memo[state.name.toLowerCase()] = state
    return memo
  }, {})

  const { id: deviceTypeIdRouter } = await knex('DeviceType')
    .where({ externalId: 'MetacomRouter' })
    .first()

  const { id: deviceTypeIdChai } = await knex('DeviceType')
    .where({ externalId: 'CHAILIMS' })
    .first()

  const { id: deviceStatusId } = await knex('DeviceStatus')
    .where({ token: 'approved' })
    .first()

  // every clinic has a site and a Reporter device
  await Promise.all(
    _.map(labClinic.clinics, async clinic => {
      const { id: clinicGeographyId } = await knex('Geography')
        .where({
          countryId,
          stateId: (
            statesByName[clinic.stateName.toLowerCase()] || { id: null }
          ).id,
        })
        .first()

      // sites
      const siteData = Object.assign(
        {
          partnerId,
          geographyId: clinicGeographyId,
          name: clinic.name,
          shortName: clinic.shortName,
          externalId: clinic.externalId,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
      siteData.id = siteId

      const lastTime = subMinutes(now, _.random(0, 60))

      if (clinic.hasReporter) {
        const [deviceId] = await knex('Device').insert(
          Object.assign(
            {
              partnerId,
              geographyId,
              siteId,
              deviceTypeId: deviceTypeIdReporter,
              deviceStatusId,
              name: `${siteData.name} Reporter`,
              shortName: `R-${_.random(100000, 999999)}`,
              serial: `S1-R-${_.random(100000, 999999)}`,
              lastSeenOn: lastTime,
              lastPingOn: lastTime,
              lastPingFromIp: '41.70.127.33',
              putInService: subMonths(now, 22),
              putInServiceSource: 'Installed at clinic',
              configurationData: '{}',
            },
            auditFields
          )
        )

        await knex('DeviceApiKey').insert(
          Object.assign(
            {
              token:
                clinic.name === 'Mponela Rural Hospital' // this is the reporter demo site - keep API key  static
                  ? 'g39ypz0725x1cubf0vq3'
                  : randomToken(),
              revoked: 0,
              partnerId,
              geographyId,
              siteId,
              deviceId,
            },
            auditFields
          )
        )

        // Router
        await knex('Device').insert(
          Object.assign({}, auditFields, {
            name: `Router at ${siteData.name}`,
            shortName: `RO-${siteData.shortName}`,
            deviceTypeId: deviceTypeIdRouter,
            deviceStatusId,
            partnerId: siteData.partnerId,
            geographyId: siteData.geographyId,
            siteId: siteData.id,
            lastSeenOn: lastTime,
            lastPingOn: lastTime,
          })
        )
      }
    })
  )

  // Labs have m2000 and modem
  await Promise.all(
    _.map(labClinic.labs, async lab => {
      // every lab has a site, m2000 device and a user assigned to it
      const siteData = Object.assign(
        {
          partnerId,
          geographyId,
          name: lab.name,
          shortName: lab.shortName,
          externalId: lab.externalId,
          latitude: lab.latitude,
          longitude: lab.longitude,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
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

      const [labAdminPersonId] = await knex('Person').insert(
        Object.assign(
          {
            userId: labAdminUserId,
            name: `${lab.shortName} Admin`,
            lastPartnerId: partnerId,
            lastCountryId: countryId,
            geographyId,
            culture,
            timezone,
          },
          auditFields
        )
      )

      const [jobIdLabAdmin] = await knex('Job').insert([
        { personId: labAdminPersonId, jobFunctionId: jobFunctionIdLabAdmin },
      ])
      await knex('JobContext').insert({ jobId: jobIdLabAdmin, siteId })

      if (lab.devices) {
        await Promise.all(
          _.map(lab.devices, async device => {
            const lastTime = subMinutes(now, _.random(0, 60))

            const [deviceId] = await knex('Device').insert(
              Object.assign(
                {
                  partnerId,
                  geographyId,
                  siteId,
                  deviceTypeId: deviceTypeIdChai,
                  deviceStatusId,
                  name: device.name,
                  shortName: device.shortName,
                  macAddress: device.macAddress,
                  serial: device.serial,
                  hostId: device.hostId,
                  lastSeenOn: lastTime,
                  lastPingOn: lastTime,
                  lastPingFromIp: device.lastPingFromIp,
                  putInService: subMonths(now, 30),
                  putInServiceSource: 'Installed at lab',
                  configurationData: '{}',
                },
                auditFields
              )
            )

            await knex('DeviceApiKey').insert(
              Object.assign(
                {
                  token: randomToken(),
                  revoked: 0,
                  partnerId,
                  geographyId,
                  siteId,
                  deviceId,
                },
                auditFields
              )
            )

            // Router
            await knex('Device').insert(
              Object.assign({}, auditFields, {
                name: `Router at ${siteData.name}`,
                shortName: `RO-${siteData.shortName}`,
                deviceTypeId: deviceTypeIdRouter,
                deviceStatusId,
                partnerId: siteData.partnerId,
                geographyId: siteData.geographyId,
                siteId: siteData.id,
                lastSeenOn: lastTime,
                lastPingOn: lastTime,
              })
            )
          })
        )
      }
    })
  )

  // EID Results and samples
  const { id: sampleTypeDBSId } = await knex('SampleType')
    .where('externalId', 'DBS')
    .select('id')

  const clinicsWithReporters = _.filter(labClinic.clinics, {
    hasReporter: true,
  })

  let samples = []

  async function createUniqueSampleIdForSite(prefix, siteId) {
    const randomId = prefix
      ? `${prefix}-${_.random(200000, 888888)}`
      : _.random(200000, 888888).toString()
    const existingSamplesWithId = await knex('Sample as s')
      .where('externalId', randomId)
      .select()
    if (
      (siteId && _.some(existingSamplesWithId, { originSiteId: siteId })) ||
      !_.isEmpty(existingSamplesWithId)
    ) {
      return createUniqueSampleIdForSite(prefix, siteId)
    }
    return randomId
  }

  async function createSampleEid(i) {
    const clinic = clinicsWithReporters[i % clinicsWithReporters.length]

    const { id: siteId } = await knex('Site')
      .where('externalId', clinic.externalId)
      .first()

    const externalId = await createUniqueSampleIdForSite('PREID', siteId)
    const sample = Object.assign(
      {},
      {
        externalId,
        collectedOn: calculateDateForResult(i, resultEidNumber, millisInMinute),
        sampleTypeId: sampleTypeDBSId,
        originSiteId: siteId,
      }
    )

    sample.id = await knex('Sample').insert(sample)

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
  const { id: assayIdEid } = await knex('Assay')
    .where('name', 'CHAI EID')
    .first()

  const { id: assayIdHivVl } = await knex('Assay')
    .where('name', 'CHAI HIV VL')
    .first()

  const {
    Validated: validated,
    Deliverable: deliverable,
  } = await allResultWorkflowStatusToId()

  const resultSourceLimsId = await resultSourceToId('LIMS')

  const resultTypePatientId = await resultTypeToId('Patient')

  // EID results:
  // assign categories to assay
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayIdEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayIdEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayIdEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdEid,
  })

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

  const devicesM2000 = await knex('Device')
    .where('deviceTypeId', deviceTypeIdChai)
    .select('id', 'siteId')

  async function createUniqueResultIdForDevice(
    candidateId,
    deviceId,
    tryNumber
  ) {
    const existingResultsWithId = await knex('Result as r')
      .where(
        'externalId',
        tryNumber ? `${candidateId}-${tryNumber}` : candidateId
      )
      .select()
    if (
      (deviceId && _.some(existingResultsWithId, { deviceId })) ||
      !_.isEmpty(existingResultsWithId)
    ) {
      return createUniqueResultIdForDevice(
        candidateId,
        deviceId,
        (tryNumber || 0) + 1
      )
    }
    return tryNumber ? `${candidateId}-${tryNumber}` : candidateId
  }

  async function createResultEid(i) {
    const device = devicesM2000[i % devicesM2000.length]
    const siteData = await knex('Site')
      .where('id', device.siteId)
      .first('id')
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultEidNumber, 6000)

    const rnd = _.random(0, 100)
    const result = _.find(
      possibleResultsEid,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )
    const patient = patients[_.random(patientNumber)]
    const resultData = { resultText: result.resultText }
    const resultExternalId = await createUniqueResultIdForDevice(
      sample.externalId,
      device.id
    )
    const resultId = await knex('Result').insert(
      Object.assign({}, auditFields, {
        externalId: resultExternalId,
        assayId: assayIdEid,
        partnerId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        deviceId: device.id,
        resultWorkflowStatusId: deliverable,
        longitude: -33.78725,
        latitude: -13.96692,
        resultSourceId: resultSourceLimsId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        sampleRunNumber: `${i % 2 + 1}`,
        sampleGroup: sample.externalId.substring(0, 10),
        resultCategory1: result.category1,
        resultData: JSON.stringify(resultData),
        assayVersion: '4',
        startedOn: randomDate,
        endedOn: addMinutes(randomDate, 100),
        researchId: `R-ID-${i}`,
        instrumentSerial: `S-1234-${i % 3}`,
        moduleName: 'Module A',
        moduleSerial: `M-1234-${i % 4}`,
        senderOperator: 'Frank',
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
        qcCheck: 1,
      })
    )

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: validated,
      changedOn: subHours(randomDate, 25),
      createdOn: subHours(randomDate, 26),
      createdBy: adminId,
    })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: deliverable,
      changedOn: addHours(randomDate, 2),
      createdOn: addHours(randomDate, 1),
      createdBy: adminId,
    })
  }

  for (const i of _.range(resultEidNumber)) {
    await createResultEid(i)
  }

  // HIV VL results:
  // assign categories to assay
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryLessThan1000Id,
    assayId: assayIdHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryMoreThan1000Id,
    assayId: assayIdHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryCollectNewSampleId,
    assayId: assayIdHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdHivVl,
  })

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

    const { id: siteId } = await knex('Site')
      .where('externalId', clinic.externalId)
      .first()

    const externalId = await createUniqueSampleIdForSite('PRHIVVL', siteId)
    const sample = Object.assign(
      {},
      {
        externalId,
        collectedOn: calculateDateForResult(
          i,
          resultHivVlNumber,
          millisInMinute
        ),
        sampleTypeId: sampleTypeDBSId,
        originSiteId: siteId,
      }
    )

    sample.id = await knex('Sample').insert(sample)

    samples.push(sample)
  }

  for (const i of _.range(resultHivVlNumber / 2)) {
    await createSampleHiv(i)
  }

  async function createResultHiv(i) {
    const device = devicesM2000[i % devicesM2000.length]
    const siteData = await knex('Site')
      .where('id', device.siteId)
      .first('id')
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

    const rnd = _.random(0, 100)
    const result = _.find(
      possibleResultsHivVl,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )
    const patient = patients[_.random(patientNumber)]

    let copies = null
    if (result.resultText.indexOf('X Copies') !== -1) {
      if (result.category1 === resultCategoryLessThan1000Id) {
        copies = _.random(839, 999)
      } else if (result.category1 === resultCategoryMoreThan1000Id) {
        copies = _.random(1000, 2000000)
      }
    }

    const resultData = {
      resultText: copies
        ? result.resultText.replace('X', copies)
        : result.resultText,
    }
    const resultExternalId = await createUniqueResultIdForDevice(
      sample.externalId,
      device.id
    )
    const resultId = await knex('Result').insert(
      Object.assign({}, auditFields, {
        externalId: resultExternalId,
        assayId: assayIdHivVl,
        partnerId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        deviceId: device.id,
        resultWorkflowStatusId: deliverable,
        longitude: -33.78725,
        latitude: -13.96692,
        resultSourceId: resultSourceLimsId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        sampleRunNumber: `${i % 2 + 1}`,
        sampleGroup: sample.externalId.substring(0, 10),
        resultCategory1: result.category1,
        resultData: JSON.stringify(resultData),
        assayVersion: '3',
        startedOn: randomDate,
        endedOn: addMinutes(randomDate, 100),
        researchId: `R-ID-${i}`,
        instrumentSerial: `S-1234-${i % 3}`,
        moduleName: 'Module A',
        moduleSerial: `M-1234-${i % 4}`,
        senderOperator: 'Frank',
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
        qcCheck: 1,
      })
    )

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: validated,
      changedOn: subHours(randomDate, 25),
      createdOn: subHours(randomDate, 26),
      createdBy: adminId,
    })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: deliverable,
      changedOn: addHours(randomDate, 2),
      createdOn: addHours(randomDate, 1),
      createdBy: adminId,
    })
  }

  for (const i of _.range(resultHivVlNumber)) {
    await createResultHiv(i)
  }
}
