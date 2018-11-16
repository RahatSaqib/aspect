module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const Promise = require('bluebird')

const config = require('../../src/config')
const southAfricaLabClinic = require('./fixtures/southAfricaLabClinic.json')
const { rowsAsObject, getPermissionModules } = require('../utils')
const { seedNotifications } = require('../utils_sa_nhls')
const {
  allResultCategoryToId,
  allResultWorkflowStatusToId,
  resultTypeToId,
  deviceTypeToId,
} = require('../../src/shared/dictionary')
const { createUniqueIdForResult } = require('../../src/result/service')
const { parseDateOrDefault } = require('../../src/shared/date')

const {
  deviceTypeCategoryToId,
  allFeatureToId,
  assayTypeToId,
  partnerTypeToId,
  resultSourceToId,
  unitToId,
  deviceStatusToId,
} = require('../../src/shared/dictionary')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'nhls_eid' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'nhls_eid',
    password: bcrypt.hashSync('nhlsEid2018', saltRounds),
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

  const deviceTypeCategoryConnector = await deviceTypeCategoryToId('Connector')

  await knex('DeviceType').insert({
    externalId: 'AlereFtpConnector',
    name: 'Alere FTP Connector',
    manufacturer: 'SystemOne',
    plugin: 'alereftpconnector',
    deviceTypeCategoryId: deviceTypeCategoryConnector,
  })

  // Reuse previously seeded "static" data
  const [
    deviceTypes,
    modules,
    features,
    approvedDeviceStatusId,
  ] = await Promise.all([
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    getPermissionModules(knex),
    allFeatureToId(),
    deviceStatusToId('approved'),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'South Africa NHLS',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  const [southAfricaCountry] = await knex('Country as c')
    .where({ 'c.a3': 'ZAF' })
    .select('c.id', 'c.culture', 'c.timezone')
  const { culture, timezone, id: countryId } = southAfricaCountry
  const { id: southAfricaGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  // create site for Alere FTP Connector device
  const [southAfricaNhlsAlereFtpConnectorSiteId] = await knex('Site').insert(
    Object.assign(
      {
        name: 'SA NHLS Alere FTP Connector Site',
        shortName: 'SA NHLS Alere',
        externalId: 'sa_nhls_alere_ftp',
        partnerId,
        geographyId: southAfricaGeographyId,
      },
      auditFields
    )
  )

  // insert SA NHLS Alere q Connector device
  const [southAfricaNhlsAlereFtpConnectorDeviceId] = await knex(
    'Device'
  ).insert(
    Object.assign(
      {
        name: 'South Africa NHLS Alere FTP Connector',
        deviceTypeId: deviceTypes.AlereFtpConnector.id,
        deviceStatusId: approvedDeviceStatusId,
        partnerId,
        geographyId: southAfricaGeographyId,
        siteId: southAfricaNhlsAlereFtpConnectorSiteId,
      },
      auditFields
    )
  )

  await knex('DeviceApiKey').insert(
    Object.assign(
      {
        token: 'aqcajk92773te5t4dv01',
        revoked: 0,
        partnerId,
        geographyId: southAfricaGeographyId,
        deviceId: southAfricaNhlsAlereFtpConnectorDeviceId,
      },
      auditFields
    )
  )

  const southAfricaProvinces = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 's.id', 's.name')
  const southAfricaDistricts = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  const provincesByName = southAfricaProvinces.reduce(
    (provinceMemo, province) => {
      provinceMemo[province.name.toLowerCase()] = province
      const provinceDistricts = _.filter(southAfricaDistricts, {
        stateName: province.name,
      })
      if (provinceDistricts) {
        provinceMemo[
          province.name.toLowerCase()
        ].districts = provinceDistricts.reduce((districtMemo, district) => {
          districtMemo[district.name.toLowerCase()] = district
          return districtMemo
        }, {})
      }
      return provinceMemo
    },
    {}
  )

  await Promise.all(
    _.map(southAfricaLabClinic.clinics, async clinic => {
      const province = clinic.stateName
        ? provincesByName[clinic.stateName.toLowerCase()] || {
            id: null,
            districts: {},
          }
        : {
            id: null,
            districts: {},
          }
      const district =
        province.districts && clinic.lgaName
          ? province.districts[clinic.lgaName.toLowerCase()] || {
              id: null,
            }
          : {
              id: null,
            }
      const { id: clinicGeographyId } = await knex('Geography')
        .where({
          countryId: southAfricaCountry.id,
          stateId: province.id,
          lgaId: district.id,
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
          timezoneId: southAfricaCountry.timezone,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
      siteData.id = siteId

      if (clinic.devices) {
        await Promise.all(
          _.map(clinic.devices, async device =>
            knex('Device').insert(
              Object.assign(
                {
                  partnerId,
                  geographyId: clinicGeographyId,
                  siteId,
                  deviceTypeId: await deviceTypeToId(device.deviceTypeId),
                  deviceStatusId: await deviceStatusToId('approved'),
                  name: `${siteData.shortName} ${device.deviceTypeId} ${
                    device.deviceSerial
                  }`,
                  shortName: `${device.deviceTypeId} ${device.deviceSerial}`,
                  serial: device.deviceSerial,
                  culture: southAfricaCountry.culture,
                  timezone: siteData.timezoneId,
                  configurationData: '{}',
                },
                auditFields
              )
            )
          )
        )
      }
    })
  )

  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'NHLS EID Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId: southAfricaGeographyId,
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
  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.browse.view },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
  ])
  await knex('JobFunctionFeature').insert([
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.device },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.result },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.site },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId: southAfricaGeographyId,
  })

  const [jobFunctionIdLabUser] = await knex('JobFunction').insert({
    name: 'Lab User',
    partnerId,
  })
  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.browse.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.site.view },
  ])
  await knex('JobFunctionFeature').insert([
    { jobFunctionId: jobFunctionIdLabUser, featureId: features.result },
  ])

  // create site for lab user
  await Promise.all(
    _.map(['1', '2', '3'], async siteNum => {
      const [siteId] = await knex('Site').insert(
        Object.assign(
          {
            partnerId,
            geographyId: southAfricaGeographyId,
            name: `SA NHLS Site ${siteNum}`,
            shortName: `SA NHLS Site ${siteNum}`,
            externalId: `sa_nhls_site${siteNum}`,
          },
          auditFields
        )
      )
      const labUserName = `nhls_lab${siteNum}`
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
            name: `NHLS Lab User ${siteNum}`,
            lastPartnerId: partnerId,
            lastCountryId: countryId,
            geographyId: southAfricaGeographyId,
            culture,
            timezone,
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

  const [alereQHiv12DetectAssayId] = await knex('Assay').insert({
    name: 'Alere q HIV-1/2 Detect',
    i18nKey: 'assayAlereQHiv12Detect',
    externalId: 'assayAlereQHiv12Detect',
    assayTypeId: await assayTypeToId('HIV Qual'),
    deviceTypeId: deviceTypes.AlereQ.id,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({
      resultNo: { list: false, order: 1, type: 'string', title: 'Result No' },
      deviceSerial: {
        list: true,
        order: 2,
        type: 'string',
        title: 'Device Serial',
      },
      testName: { list: true, order: 3, type: 'string', title: 'Test Name' },
      cartridgeId: {
        list: true,
        order: 4,
        type: 'string',
        title: 'Cartridge ID',
      },
      sampleId: { list: true, order: 5, type: 'string', title: 'Sample ID' },
      hiv1MnResult: {
        list: true,
        order: 6,
        type: 'string',
        title: 'HIV-1 M/N',
      },
      hiv1OResult: { list: true, order: 7, type: 'string', title: 'HIV-1 O' },
      hiv2Result: { list: true, order: 8, type: 'string', title: 'HIV-2' },
      errorCode: {
        list: true,
        order: 9,
        type: 'string',
        title: 'Error Code',
      },
      operator: { list: true, order: 10, type: 'string', title: 'Operator' },
      timeStamp: {
        list: true,
        order: 11,
        type: 'time',
        title: 'Timestamp',
      },
      sampleDetection: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Sample Detection Check',
      },
      deviceCheck: {
        list: false,
        order: 13,
        type: 'string',
        title: 'Device Check',
      },
      hiv1PositiveControl: {
        list: false,
        order: 14,
        type: 'string',
        title: 'HIV-1 Positive Control',
      },
      hiv2PositiveControl: {
        list: false,
        order: 15,
        type: 'string',
        title: 'HIV-2 Positive Control',
      },
      negativeControl: {
        list: false,
        order: 16,
        type: 'string',
        title: 'Negative Control',
      },
      analysisCheck: {
        list: false,
        order: 17,
        type: 'string',
        title: 'Analysis Check',
      },
      softwareVersion: {
        list: false,
        order: 18,
        type: 'string',
        title: 'Device Software Version',
      },
      sourceFile: {
        list: false,
        order: 19,
        type: 'string',
        title: 'Source File',
      },
      pickedUpOn: {
        list: false,
        order: 20,
        type: 'time',
        title: 'Picked Up On',
      },
    }),
  })
  const [alereQHiv12VLPlasmaAssayId] = await knex('Assay').insert({
    name: 'Alere q HIV-1/2 VL plasma',
    i18nKey: 'assayAlereQHiv12VLPlasma',
    externalId: 'assayAlereQHiv12VLPlasma',
    assayTypeId: await assayTypeToId('HIV VL'),
    deviceTypeId: deviceTypes.AlereQ.id,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({
      resultNo: { list: false, order: 1, type: 'string', title: 'Result No' },
      deviceSerial: {
        list: true,
        order: 2,
        type: 'string',
        title: 'Device Serial',
      },
      testName: { list: true, order: 3, type: 'string', title: 'Test Name' },
      cartridgeId: {
        list: true,
        order: 4,
        type: 'string',
        title: 'Cartridge ID',
      },
      sampleId: { list: true, order: 5, type: 'string', title: 'Sample ID' },
      hiv1MNResult: {
        list: true,
        order: 6,
        type: 'string',
        title: 'HIV-1 M/N cp/mL',
      },
      hiv1OResult: {
        list: true,
        order: 7,
        type: 'string',
        title: 'HIV-1 O cp/mL',
      },
      hiv2Result: {
        list: true,
        order: 8,
        type: 'string',
        title: 'HIV-2 cp/mL',
      },
      errorCode: {
        list: true,
        order: 9,
        type: 'string',
        title: 'Error Code',
      },
      operator: { list: true, order: 10, type: 'string', title: 'Operator' },
      timeStamp: {
        list: true,
        order: 11,
        type: 'time',
        title: 'Timestamp',
      },
      sampleDetection: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Sample Detection Check',
      },
      deviceCheck: {
        list: false,
        order: 13,
        type: 'string',
        title: 'Device Check',
      },
      hiv1PositiveControl: {
        list: false,
        order: 14,
        type: 'string',
        title: 'HIV-1 Positive Control',
      },
      hiv2PositiveControl: {
        list: false,
        order: 15,
        type: 'string',
        title: 'HIV-2 Positive Control',
      },
      negativeControl: {
        list: false,
        order: 16,
        type: 'string',
        title: 'Negative Control',
      },
      analysisCheck: {
        list: false,
        order: 17,
        type: 'string',
        title: 'Analysis Check',
      },
      softwareVersion: {
        list: false,
        order: 18,
        type: 'string',
        title: 'Device Software Version',
      },
      deviceMode: {
        list: false,
        order: 19,
        type: 'string',
        title: 'Device Mode',
      },
      status: {
        list: false,
        order: 20,
        type: 'string',
        title: 'Status',
      },
      sourceFile: {
        list: false,
        order: 21,
        type: 'string',
        title: 'Source File',
      },
      pickedUpOn: {
        list: false,
        order: 22,
        type: 'time',
        title: 'Picked Up On',
      },
    }),
  })

  const piece = await unitToId('Piece')
  const [alereQHiv12DetectCartridgeId] = await knex('Consumable').insert({
    name: 'Alere q HIV-1/2 Detect Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Alere',
  })
  const [alereQHiv12VLPlasmaCartridgeId] = await knex('Consumable').insert({
    name: 'Alere q HIV-1/2 VL Plasma Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Alere',
  })

  await knex('ConsumableAssay').insert([
    {
      assayId: alereQHiv12DetectAssayId,
      consumableId: alereQHiv12DetectCartridgeId,
      quantity: 1,
    },
    {
      assayId: alereQHiv12VLPlasmaAssayId,
      consumableId: alereQHiv12VLPlasmaCartridgeId,
      quantity: 1,
    },
  ])

  const geneXpertHiv1VlFormSchema = {
    fields: {
      hospitalNumber: {
        i18nLabel: 'hospitalNumber',
        control: {
          type: 'TextBox',
        },
        order: 1,
      },
      studyID: {
        i18nLabel: 'studyID',
        control: {
          type: 'TextBox',
        },
        order: 2,
      },
      nameOfPatient: {
        i18nLabel: 'nameOfPatient',
        control: {
          type: 'TextBox',
        },
        order: 3,
      },
      surnameOfPatient: {
        i18nLabel: 'surnameOfPatient',
        control: {
          type: 'TextBox',
        },
        order: 4,
      },
      ward: {
        i18nLabel: 'ward',
        control: {
          type: 'TextBox',
        },
        order: 5,
      },
      timeSampleTaken: {
        i18nLabel: 'timeSampleTaken',
        control: {
          type: 'DateTime',
        },
        order: 6,
      },
      sampleType: {
        i18nLabel: 'sampleType',
        control: {
          type: 'DropDown',
          options: [
            {
              i18nText: 'studyOfSampleType',
              value: 'study',
            },
            {
              i18nText: 'EQAOfSampleType',
              value: 'EQA',
            },
            {
              i18nText: 'miscOfSampleType',
              value: 'misc',
            },
          ],
        },
        order: 7,
      },
    },
    sendChangesOn: 'change',
  }

  const assayAlereQHiv12FormSchema = _.merge({}, geneXpertHiv1VlFormSchema, {
    fields: {
      timeInstrumentResulted: {
        i18nLabel: 'timeInstrumentResulted',
        control: {
          type: 'DateTime',
        },
        order: 8,
      },
    },
    sendChangesOn: 'submit',
  })

  const { id: assayGeneXpertHiv1VlId } = await knex('Assay')
    .where({ externalId: 'GxHiv1Vl' })
    .first('id')
  const { id: assayGeneXpertHiv1QualId } = await knex('Assay')
    .where({ externalId: 'GxHiv1Qual' })
    .first('id')

  await knex('ResultForm').insert([
    {
      partnerId,
      assayId: assayGeneXpertHiv1VlId,
      formSchema: JSON.stringify(geneXpertHiv1VlFormSchema),
    },
    {
      partnerId,
      assayId: assayGeneXpertHiv1QualId,
      formSchema: JSON.stringify(geneXpertHiv1VlFormSchema),
    },
    {
      partnerId,
      assayId: alereQHiv12VLPlasmaAssayId,
      formSchema: JSON.stringify(assayAlereQHiv12FormSchema),
    },
    {
      partnerId,
      assayId: alereQHiv12DetectAssayId,
      formSchema: JSON.stringify(assayAlereQHiv12FormSchema),
    },
  ])

  const { id: siteId, geographyId } = await knex('Site')
    .where({ partnerId, externalId: 'CMJAH' })
    .first()
  // get/create device
  const { id: deviceId, serial: deviceSerial } = await knex('Device')
    .where({
      partnerId,
      geographyId,
      siteId,
    })
    .first('id', 'serial')

  const {
    OK: resultWorkflowStatusOKId,
    Error: resultWorkflowStatusErrorId,
  } = await allResultWorkflowStatusToId()
  const resultSourceDiagnosticDeviceId = await resultSourceToId(
    'DiagnosticDevice'
  )
  const resultTypePatientId = await resultTypeToId('Patient')

  const {
    Detected: resultCategoryDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    NoResult: resultCategoryNoResultId,
    Error: resultCategoryErrorId,
  } = await allResultCategoryToId()

  const results = [
    {
      sampleId: 'TEST',
      testStartedOn: parseDateOrDefault('2018-04-18 09:55:24', now),
      testEndedOn: parseDateOrDefault('2018-04-18 09:55:24', now),
      resultWorkflowStatusId: resultWorkflowStatusErrorId,
      category1: resultCategoryErrorId,
      category2: resultCategoryErrorId,
      resultData:
        '{"status": "IUO", "operator": "LUCIA", "resultNo": 7, "sampleId": "TEST", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "21501", "timeStamp": "2018-04-18T09:55:24", "deviceMode": "", "hiv2Result": "---", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653001709", "deviceCheck": "Pass", "hiv1OResult": "---", "deviceSerial": "NAT-04000585", "hiv1MNResult": "---", "analysisCheck": "----", "negativeControl": "----", "sampleDetection": "Fail", "softwareVersion": "0.24.5", "hiv1PositiveControl": "----", "hiv2PositiveControl": "----"}',
      consumableSerial: '0653001709',
      senderVersion: '0.24.5',
      senderOperator: 'LUCIA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	7;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653001709;	TEST;	---;	---;	---;	21501;	LUCIA;	2018-04-18 09:55:24;	Fail;	Pass;	----;	----;	----;	----;	0.24.5;	;	IUO',
      errorCode: '21501',
    },
    {
      sampleId: 'TEST 2 FCS',
      testStartedOn: parseDateOrDefault('2018-04-18 10:58:01', now),
      testEndedOn: parseDateOrDefault('2018-04-18 10:58:01', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "LUCIA", "resultNo": 8, "sampleId": "TEST 2 FCS", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-04-18T10:58:01", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653001756", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653001756',
      senderVersion: '0.24.5',
      senderOperator: 'LUCIA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	8;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653001756;	TEST 2 FCS;	Undetected;	Undetected;	Undetected;	0;	LUCIA;	2018-04-18 10:58:01;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'TEST',
      testStartedOn: parseDateOrDefault('2018-04-18 12:50:43', now),
      testEndedOn: parseDateOrDefault('2018-04-18 12:50:43', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "GREG", "resultNo": 9, "sampleId": "TEST", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-04-18T12:50:43", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653002528", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653002528',
      senderVersion: '0.24.5',
      senderOperator: 'GREG',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	9;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653002528;	TEST;	Undetected;	Undetected;	Undetected;	0;	GREG;	2018-04-18 12:50:43;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'LOG 3',
      testStartedOn: parseDateOrDefault('2018-05-18 14:08:11', now),
      testEndedOn: parseDateOrDefault('2018-05-18 14:08:11', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 10, "sampleId": "LOG 3", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-05-18T14:08:11", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653002552", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "2299 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653002552',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	10;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653002552;	LOG 3;	2299 cp/mL;	Undetected;	Undetected;	0;	NAMBITHA;	2018-05-18 14:08:11;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VISA18004A',
      testStartedOn: parseDateOrDefault('2018-05-23 15:45:41', now),
      testEndedOn: parseDateOrDefault('2018-05-23 15:45:41', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "Zukiswa", "resultNo": 11, "sampleId": "VISA18004A", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-05-23T15:45:41", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653002559", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653002559',
      senderVersion: '0.24.5',
      senderOperator: 'Zukiswa',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	11;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653002559;	VISA18004A;	Undetected;	Undetected;	Undetected;	0;	Zukiswa;	2018-05-23 15:45:41;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VISA1802A',
      testStartedOn: parseDateOrDefault('2018-05-23 19:26:24', now),
      testEndedOn: parseDateOrDefault('2018-05-23 19:26:24', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "Zukiswa", "resultNo": 12, "sampleId": "VISA1802A", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-05-23T19:26:24", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653002562", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "4823 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653002562',
      senderVersion: '0.24.5',
      senderOperator: 'Zukiswa',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	12;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653002562;	VISA1802A;	4823 cp/mL;	Undetected;	Undetected;	0;	Zukiswa;	2018-05-23 19:26:24;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VQA01B',
      testStartedOn: parseDateOrDefault('2018-08-07 15:00:27', now),
      testEndedOn: parseDateOrDefault('2018-08-07 15:00:27', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "LYNETTE", "resultNo": 13, "sampleId": "VQA01B", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-07T15:00:27", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653002478", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "1267 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653002478',
      senderVersion: '0.24.5',
      senderOperator: 'LYNETTE',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	13;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653002478;	VQA01B;	1267 cp/mL;	Undetected;	Undetected;	0;	LYNETTE;	2018-08-07 15:00:27;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VQA02B',
      testStartedOn: parseDateOrDefault('2018-08-08 14:36:54', now),
      testEndedOn: parseDateOrDefault('2018-08-08 14:36:54', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "LYNETTE", "resultNo": 14, "sampleId": "VQA02B", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-08T14:36:54", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653002480", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653002480',
      senderVersion: '0.24.5',
      senderOperator: 'LYNETTE',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	14;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653002480;	VQA02B;	Undetected;	Undetected;	Undetected;	0;	LYNETTE;	2018-08-08 14:36:54;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VQA 03B',
      testStartedOn: parseDateOrDefault('2018-08-08 16:33:12', now),
      testEndedOn: parseDateOrDefault('2018-08-08 16:33:12', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 15, "sampleId": "VQA 03B", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-08T16:33:12", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0653002506", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0653002506',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	15;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0653002506;	VQA 03B;	Undetected;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-08 16:33:12;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VQA 04B',
      testStartedOn: parseDateOrDefault('2018-08-09 11:29:22', now),
      testEndedOn: parseDateOrDefault('2018-08-09 11:29:22', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 16, "sampleId": "VQA 04B", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-09T11:29:22", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600678", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "25563 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600678',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	16;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600678;	VQA 04B;	25563 cp/mL;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-09 11:29:22;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VQA 05B',
      testStartedOn: parseDateOrDefault('2018-08-09 15:22:54', now),
      testEndedOn: parseDateOrDefault('2018-08-09 15:22:54', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 17, "sampleId": "VQA 05B", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-09T15:22:54", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600712", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "3629 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600712',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	17;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600712;	VQA 05B;	3629 cp/mL;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-09 15:22:54;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: '100',
      testStartedOn: parseDateOrDefault('2018-08-13 12:04:19', now),
      testEndedOn: parseDateOrDefault('2018-08-13 12:04:19', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "LUCIA", "resultNo": 18, "sampleId": "100", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-13T12:04:19", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600707", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "89881 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600707',
      senderVersion: '0.24.5',
      senderOperator: 'LUCIA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	18;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600707;	100;	89881 cp/mL;	Undetected;	Undetected;	0;	LUCIA;	2018-08-13 12:04:19;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'pos c 6',
      testStartedOn: parseDateOrDefault('2018-08-13 16:35:35', now),
      testEndedOn: parseDateOrDefault('2018-08-13 16:35:35', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "LYNETTE", "resultNo": 19, "sampleId": "pos c 6", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-13T16:35:35", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600715", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "5153 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600715',
      senderVersion: '0.24.5',
      senderOperator: 'LYNETTE',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	19;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600715;	pos c 6;	5153 cp/mL;	Undetected;	Undetected;	0;	LYNETTE;	2018-08-13 16:35:35;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'neg c 12',
      testStartedOn: parseDateOrDefault('2018-08-13 19:11:14', now),
      testEndedOn: parseDateOrDefault('2018-08-13 19:11:14', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 20, "sampleId": "neg c 12", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-13T19:11:14", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600902", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600902',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	20;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600902;	neg c 12;	Undetected;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-13 19:11:14;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'neg c 12',
      testStartedOn: parseDateOrDefault('2018-08-13 20:54:50', now),
      testEndedOn: parseDateOrDefault('2018-08-13 20:54:50', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 21, "sampleId": "neg c 12", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-13T20:54:50", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600882", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600882',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	21;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600882;	neg c 12;	Undetected;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-13 20:54:50;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'pos c 6',
      testStartedOn: parseDateOrDefault('2018-08-14 13:31:40', now),
      testEndedOn: parseDateOrDefault('2018-08-14 13:31:40', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "LYNETTE", "resultNo": 22, "sampleId": "pos c 6", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-14T13:31:40", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600916", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "2936 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600916',
      senderVersion: '0.24.5',
      senderOperator: 'LYNETTE',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	22;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600916;	pos c 6;	2936 cp/mL;	Undetected;	Undetected;	0;	LYNETTE;	2018-08-14 13:31:40;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VAL0004CL',
      testStartedOn: parseDateOrDefault('2018-08-14 16:57:01', now),
      testEndedOn: parseDateOrDefault('2018-08-14 16:57:01', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "SC", "resultNo": 23, "sampleId": "VAL0004CL", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-14T16:57:01", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600929", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600929',
      senderVersion: '0.24.5',
      senderOperator: 'SC',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	23;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600929;	VAL0004CL;	Undetected;	Undetected;	Undetected;	0;	SC;	2018-08-14 16:57:01;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VAL0019CL',
      testStartedOn: parseDateOrDefault('2018-08-14 20:10:16', now),
      testEndedOn: parseDateOrDefault('2018-08-14 20:10:16', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 24, "sampleId": "VAL0019CL", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-14T20:10:16", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600758", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600758',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	24;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600758;	VAL0019CL;	Undetected;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-14 20:10:16;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'pos c 6',
      testStartedOn: parseDateOrDefault('2018-08-15 03:41:51', now),
      testEndedOn: parseDateOrDefault('2018-08-15 03:41:51', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 25, "sampleId": "pos c 6", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-15T03:41:51", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600764", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "2803 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600764',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	25;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600764;	pos c 6;	2803 cp/mL;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-15 03:41:51;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VAL0032CL',
      testStartedOn: parseDateOrDefault('2018-08-15 09:29:51', now),
      testEndedOn: parseDateOrDefault('2018-08-15 09:29:51', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "SC", "resultNo": 26, "sampleId": "VAL0032CL", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-15T09:29:51", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600784", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "5961 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600784',
      senderVersion: '0.24.5',
      senderOperator: 'SC',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	26;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600784;	VAL0032CL;	5961 cp/mL;	Undetected;	Undetected;	0;	SC;	2018-08-15 09:29:51;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VAL0047CL',
      testStartedOn: parseDateOrDefault('2018-08-15 11:49:35', now),
      testEndedOn: parseDateOrDefault('2018-08-15 11:49:35', now),
      resultWorkflowStatusId: resultWorkflowStatusErrorId,
      category1: resultCategoryNoResultId,
      category2: resultCategoryNoResultId,
      resultData:
        '{"status": "IUO", "operator": "SC", "resultNo": 27, "sampleId": "VAL0047CL", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "23026", "timeStamp": "2018-08-15T11:49:35", "deviceMode": "", "hiv2Result": "None", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600532", "deviceCheck": "Pass", "hiv1OResult": "None", "deviceSerial": "NAT-04000585", "hiv1MNResult": "None", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Fail", "hiv2PositiveControl": "Fail"}',
      consumableSerial: '0659600532',
      senderVersion: '0.24.5',
      senderOperator: 'SC',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	27;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600532;	VAL0047CL;	None;	None;	None;	23026;	SC;	2018-08-15 11:49:35;	Pass;	Pass;	Fail;	Fail;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: '23026',
    },
    {
      sampleId: 'VAL0062CL',
      testStartedOn: parseDateOrDefault('2018-08-15 16:51:46', now),
      testEndedOn: parseDateOrDefault('2018-08-15 16:51:46', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "SC", "resultNo": 28, "sampleId": "VAL0062CL", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-15T16:51:46", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600571", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600571',
      senderVersion: '0.24.5',
      senderOperator: 'SC',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	28;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600571;	VAL0062CL;	Undetected;	Undetected;	Undetected;	0;	SC;	2018-08-15 16:51:46;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VAL0077CL',
      testStartedOn: parseDateOrDefault('2018-08-15 21:20:36', now),
      testEndedOn: parseDateOrDefault('2018-08-15 21:20:36', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 29, "sampleId": "VAL0077CL", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-15T21:20:36", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600594", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "Undetected", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600594',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	29;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600594;	VAL0077CL;	Undetected;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-15 21:20:36;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
    {
      sampleId: 'VAL0092CL',
      testStartedOn: parseDateOrDefault('2018-08-16 03:55:03', now),
      testEndedOn: parseDateOrDefault('2018-08-16 03:55:03', now),
      resultWorkflowStatusId: resultWorkflowStatusOKId,
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      resultData:
        '{"status": "IUO", "operator": "NAMBITHA", "resultNo": 30, "sampleId": "VAL0092CL", "testName": "Alere™ q HIV-1/2 VL plasma", "errorCode": "0", "timeStamp": "2018-08-16T03:55:03", "deviceMode": "", "hiv2Result": "Undetected", "pickedUpOn": "2018-11-14T14:44:47.561056", "sourceFile": "/home/south_africa_nhls/ftp/alere_q/07-05_NAT-04000585_2018-09-05-10-05-51.zip", "cartridgeId": "0659600573", "deviceCheck": "Pass", "hiv1OResult": "Undetected", "deviceSerial": "NAT-04000585", "hiv1MNResult": "< 800 cp/mL", "analysisCheck": "Pass", "negativeControl": "Pass", "sampleDetection": "Pass", "softwareVersion": "0.24.5", "hiv1PositiveControl": "Pass", "hiv2PositiveControl": "Pass"}',
      consumableSerial: '0659600573',
      senderVersion: '0.24.5',
      senderOperator: 'NAMBITHA',
      rawData:
        '	Result No;	Device Serial;	Test Name;	Cartridge ID;	Sample ID;	HIV-1 M/N cp/mL;	HIV-1 O cp/mL;	HIV-2 cp/mL;	Error Code;	Operator;	Timestamp;	Sample Detection;	Device;	HIV-1 Positive Control;	HIV-2 Positive Control;	Negative Control;	Analysis;	Device Software;	Device Mode;	Status\n	30;	NAT-04000585;	Alere™ q HIV-1/2 VL plasma;	0659600573;	VAL0092CL;	< 800 cp/mL;	Undetected;	Undetected;	0;	NAMBITHA;	2018-08-16 03:55:03;	Pass;	Pass;	Pass;	Pass;	Pass;	Pass;	0.24.5;	;	IUO',
      errorCode: null,
    },
  ]

  await Promise.map(
    results,
    async result => {
      const [sampleId] = await knex('Sample').insert({
        externalId: result.sampleId,
        originSiteId: siteId,
      })
      const [resultId] = await knex('Result').insert(
        Object.assign({}, auditFields, {
          externalId: createUniqueIdForResult(
            deviceSerial,
            result.testStartedOn,
            result.testEndedOn,
            result.sampleId
          ),
          assayId: alereQHiv12VLPlasmaAssayId,
          partnerId,
          geographyId,
          siteId,
          deviceId,
          resultWorkflowStatusId: result.resultWorkflowStatusId,
          resultSourceId: resultSourceDiagnosticDeviceId,
          resultTypeId: resultTypePatientId,
          sampleId,
          resultCategory1: result.category1,
          resultCategory2: result.category2,
          resultData: result.resultData,
          startedOn: result.testStartedOn,
          endedOn: result.testEndedOn,
          instrumentSerial: deviceSerial,
          consumableSerial: result.consumableSerial,
          senderVersion: result.senderVersion,
          senderOperator: result.senderOperator,
          rawData: result.rawData,
          errorCode: result.errorCode,
          qcCheck: 0,
        })
      )
      await knex('ResultWorkflowLog').insert({
        resultId,
        resultWorkflowStatusId: result.resultWorkflowStatusId,
        changedOn: now,
        createdOn: now,
        reason: 'Device API Update',
        operator: result.senderOperator,
      })
    },
    { concurrency: config.db.connectionLimit }
  )

  await seedNotifications(knex, { partnerId })
}
