module.exports = require('../../src/db').seed(seed)

let config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const millisInHour = 1000*60*60
const deviceNumber = 50
const routerNumber = 20
const resultMtbNumber = 200
const saltRounds = parseInt(config.passwordSaltRounds)

function* seed(knex){
  // Create admin user and audit fields
  let now = new Date()
  let [adminId] = yield knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0
  })
  let auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId
  }

  // Create partner types
  const partnerTypeFundingId = yield knex('PartnerType').insert({
    name: 'Funding'
  })

  const partnerTypeImplementingId = yield knex('PartnerType').insert({
    name: 'Implementing'
  })

  yield knex('PartnerType').insert({
    name: 'Operating'
  })

  // Create partners
  let [partnerOneId] = yield knex('Partner').insert({
    name: 'Partner One',
    partnerTypeId: partnerTypeFundingId
  })

  let [partnerTwoId] = yield knex('Partner').insert({
    name: 'Partner Two',
    partnerTypeId: partnerTypeImplementingId
  })

  let [partnerOneOrgUnitId] = yield knex('OrgUnit').insert({
    name: 'Partner One',
    partnerId: partnerOneId,
    depth: 1,
    leftBound: 1,
    rightBound: 6
  })

  let [regionNortheastId] = yield knex('OrgUnit').insert({
    name: 'Northeast',
    partnerId: partnerOneId,
    depth: 2,
    leftBound: 2,
    rightBound: 3
  })

  let [regionMidwestId] = yield knex('OrgUnit').insert({
    name: 'Midwest',
    partnerId: partnerOneId,
    depth: 2,
    leftBound: 4,
    rightBound: 5
  })

  // Categories of devices (lab, connectivity...)
  let [deviceTypeCategoryLab] = yield knex('DeviceTypeCategory').insert({
    name: 'Lab',
    hasConnectivity: 0,
    hasResults: 1
  })

  let [deviceTypeCategoryConnectivity] = yield knex('DeviceTypeCategory').insert({
    name: 'Router',
    hasConnectivity: 1,
    hasResults: 0
  })

  yield knex('DeviceTypeCategory').insert({
    name: 'Integrated',
    hasConnectivity: 1,
    hasResults: 1
  })

  yield knex('DeviceTypeCategory').insert({
    name: 'Client',
    hasConnectivity: 0,
    hasResults: 0
  })

  // Device Types
  let [deviceTypeGeneXpertId] = yield knex('DeviceType').insert({
    name: 'GeneXpert',
    manufacturer: 'Cepheid',
    deviceTypeCategoryId: deviceTypeCategoryLab
  })

  let [deviceTypeAfinionId] = yield knex('DeviceType').insert({
    name: 'Afinion',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab
  })

  let [deviceTypeQId] = yield knex('DeviceType').insert({
    name: 'Q',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab
  })

  yield knex('DeviceType').insert({
    name: 'm2000',
    manufacturer: 'Abbott',
    deviceTypeCategoryId: deviceTypeCategoryLab
  })

  yield knex('DeviceType').insert({
    name: 'Daktari',
    manufacturer: 'Daktari',
    deviceTypeCategoryId: deviceTypeCategoryLab
  })

  let [deviceTypeIdRouter] = yield knex('DeviceType').insert({
    name: 'Metacom Router',
    manufacturer: 'Metacom',
    deviceTypeCategoryId: deviceTypeCategoryConnectivity
  })

  // Assays and AssayTypes
  let [assayTypeMTBRifId] = yield knex('AssayType').insert({
    name: 'MTB/Rif',
    i18nKey: 'AssayTypeMtbRif'
  })

  let [assayTypeEbolaId] = yield knex('AssayType').insert({
    name: 'Ebola',
    i18nKey: 'AssayTypeEbola'
  })

  let [assayTypeHIVVLId] = yield knex('AssayType').insert({
    name: 'HIV VL',
    i18nKey: 'AssayTypeHivVl'
  })

  let [assayTypeLipidPanelId] = yield knex('AssayType').insert({
    name: 'Lipid Panel',
    i18nKey: 'AssayTypeLipidPanel'
  })

  // define resultData object
  const geneXpertResultDataSchema = JSON.stringify({ probes: {
    title: 'Probes',
    type: 'object',
    i18nKey: 'Probes',
    properties: {
      'probeA': {
        title: 'Probe A',
        type: 'string'
      },
      'probeB': {
        title: 'Probe B',
        type: 'string'
      },
      'probeC': {
        title: 'Probe C',
        type: 'string'
      },
      'probeD': {
        title: 'Probe D',
        type: 'string'
      },
      'probeE': {
        title: 'Probe E',
        type: 'string'
      },
      'probeSpc': {
        title: 'Probe Spc',
        type: 'string'
      },
      'qc1': {
        title: 'QC1',
        type: 'string'
      },
      'qc2': {
        title: 'QC2',
        type: 'string'
      },
      'probeACt': {
        title: 'Probe A Ct',
        type: 'number'
      },
      'probeBCt': {
        title: 'Probe B Ct',
        type: 'number'
      },
      'probeCCt': {
        title: 'Probe C Ct',
        type: 'number'
      },
      'probeDCt': {
        title: 'Probe D Ct',
        type: 'number'
      },
      'probeECt': {
        title: 'Probe E Ct',
        type: 'number'
      },
      'probeSpcCt': {
        title: 'Probe Spc Ct',
        type: 'number'
      },
      'qc1Ct': {
        title: 'QC1 Ct',
        type: 'number'
      },
      'qc2Ct': {
        title: 'QC2 Ct',
        type: 'number'
      },
      'probeAEndpt': {
        title: 'Probe A Endpt',
        type: 'number'
      },
      'probeBEndpt': {
        title: 'Probe B Endpt',
        type: 'number'
      },
      'probeCEndpt': {
        title: 'Probe C Endpt',
        type: 'number'
      },
      'probeDEndpt': {
        title: 'Probe D Endpt',
        type: 'number'
      },
      'probeEEndpt': {
        title: 'Probe E Endpt',
        type: 'number'
      },
      'probeSpcEndpt': {
        title: 'Probe Spc Endpt',
        type: 'number'
      },
      'qc1Endpt': {
        title: 'QC1 Endpt',
        type: 'number'
      },
      'qc2Endpt': {
        title: 'QC2 Endpt',
        type: 'number'
      }
    }}})

  let [assayMtbRifId] = yield knex('Assay').insert({
    name: 'GeneXpert MTB/Rif',
    i18nKey: 'AssayGeneXpertMtbRif',
    assayTypeId: assayTypeMTBRifId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'ResultCategoryMtb',
    resultCategory2Label: 'Rif',
    resultCategory2i18nKey: 'ResultCategoryRif',
    resultDataSchema: geneXpertResultDataSchema
  })

  yield knex('Assay').insert({
    name: 'GeneXpert HIV VL',
    i18nKey: 'AssayGeneXpertHivVl',
    assayTypeId: assayTypeHIVVLId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'ResultCategoryMtb',
    resultCategory2Label: 'Rif',
    resultCategory2i18nKey: 'ResultCategoryRif',
    resultDataSchema: geneXpertResultDataSchema
  })

  yield knex('Assay').insert({
    name: 'GeneXpert Ebola',
    i18nKey: 'AssayGeneXpertEbola',
    assayTypeId: assayTypeEbolaId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'GP',
    resultCategory1i18nKey: 'ResultCategoryEbolaGp',
    resultCategory2Label: 'NP',
    resultCategory2i18nKey: 'ResultCategoryEbolaNp',
    resultDataSchema: geneXpertResultDataSchema
  })

  yield knex('Assay').insert({
    name: 'Afinion HIV VL',
    i18nKey: 'AssayAfinionHivVl',
    assayTypeId: assayTypeHIVVLId,
    deviceTypeId: deviceTypeAfinionId,
    resultDataSchema: JSON.stringify({
      copies: {
        title: 'copies/mL',
        type: 'number'
      },
      log: {
        title: 'log',
        type: 'number'
      }
    })
  })

  yield knex('Assay').insert({
    name: 'Afinion Lipid Panel',
    i18nKey: 'AssayAfinionLipidPanel',
    assayTypeId: assayTypeLipidPanelId,
    deviceTypeId: deviceTypeAfinionId,
    resultDataSchema: JSON.stringify({
      chol: {
        title: 'Chol (mmol/L)',
        type: 'number',
        unit: 'mmol/L'
      },
      trig: {
        title: 'Trig (mmol/L)',
        type: 'number',
        unit: 'mmol/L'
      },
      hdl: {
        title: 'HDL (mmol/L)',
        type: 'number',
        unit: 'mmol/L'
      }
    })
  })

  yield knex('Assay').insert({
    name: 'Q HIV VL',
    i18nKey: 'AssayQHivVl',
    assayTypeId: assayTypeHIVVLId,
    deviceTypeId: deviceTypeQId,
    ResultCategory1Label: 'HIV',
    ResultCategory1i18nKey: 'ResultCategoryHivVl'
  })

  //Result types
  const [resultTypePatientId] = yield knex('ResultType').insert({
    name: 'Patient',
    i18nKey: 'ResultTypePatient'
  })

  yield knex('ResultType').insert({
    name: 'EQA',
    i18nKey: 'ResultTypeEqa'
  })
  yield knex('ResultType').insert({
    name: 'Training',
    i18nKey: 'ResultTypeTraining'
  })

  yield knex('ResultType').insert({
    name: 'Calibration',
    i18nKey: 'ResultTypeCalibration'
  })

  yield knex('ResultType').insert({
    name: 'Study/Research',
    i18nKey: 'ResultTypeStudy'
  })

  // result categories
  const [resultCategoryDetectedId] = yield knex('ResultCategory').insert({
    name: 'Detected',
    i18nKey: 'ResultCategoryDetected'
  })

  const [resultCategoryNotDetectedId] =yield knex('ResultCategory').insert({
    name: 'Not Detected',
    i18nKey: 'ResultCategoryNotDetected'
  })

  const [resultCategoryIndeterminateId] = yield knex('ResultCategory').insert({
    name: 'Indeterminate',
    i18nKey: 'ResultCategoryIndeterminate'
  })

  const [resultCategoryInvalidId] = yield knex('ResultCategory').insert({
    name: 'Invalid',
    i18nKey: 'ResultCategoryInvalid'
  })

  const [resultCategoryNoResultId] = yield knex('ResultCategory').insert({
    name: 'No Result',
    i18nKey: 'ResultCategoryNoResult'
  })

  const [resultCategoryErrorId] = yield knex('ResultCategory').insert({
    name: 'Error',
    i18nKey: 'ResultCategoryError'
  })

  // assign categories to Assays
  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayMtbRifId
  })

  // Create permissions
  let modules = {}
  for(let module of permissions.modules){
    let moduleData = {}
    modules[module.name] = moduleData
    for(let activity of module.activities){
      let [permissionId] = yield knex('Permission').insert({
        module: module.name,
        activity
      })
      moduleData[activity] = permissionId
    }
  }

  // Create geographic hierarchy
  let countries = {}
  let geoDatas = []
  let siteDatas = []
  for(let country of geography.countries){
    let countryData = _.pick(country, [
      'abbreviation', 'name', 'a3', 'culture', 'countryCode',
      'stateLabel', 'lgaLabel', 'timezone', 'portNumber',
      'exportColumns', 'inventoryDaysThreshold', 'monthStartsOnDay'])
    let [countryId] = yield knex('Country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    countryData.states = {}

    for(let state of (country.states || [])){
      let stateData = Object.assign(
        {countryId: countryData.id},
        _.pick(state, ['abbreviation', 'name']))
      let [stateId] = yield knex('State').insert(stateData)
      stateData.id = stateId
      let stateKey = state.abbreviation || state.name
      countryData.states[stateKey] = stateData
      stateData.lgas = {}

      // assign org units based on state region
      let orgUnitId = _.includes(['OH', 'NE'], state.abbreviation) ? regionMidwestId
        : _.includes(['MA', 'NY'], state.abbreviation) ? regionNortheastId
        : partnerOneOrgUnitId

      for(let lga of (state.lgas || [])){
        let lgaData = Object.assign(
          {stateId: stateData.id},
          _.pick(lga, ['name']))
        let [lgaId] = yield knex('Lga').insert(lgaData)
        lgaData.id = lgaId
        stateData.lgas[lga.name] = lgaData
        lgaData.sites = {}

        let geoData = {
          countryId: countryData.id,
          stateId: stateData.id,
          lgaId: lgaData.id
        }
        geoDatas.push(geoData)

        // up to 5 of sites at each LGA
        for(let siteNumber of _.range(1, 6 - (lgaData.id % 5))){
          let siteData = Object.assign({
            partnerId: partnerOneId,
            orgUnitId,
            name: `${lga.name} ${country.lgaLabel} ${state.name} #${siteNumber}`,
            shortname: `${lga.name}, ${stateKey} #${siteNumber}`,
            identifier: `Site ${siteNumber * lgaData.id}`,
            city: `${lga.name} City`,
            street1: `${lgaData.id} Main Street`,
            zip: `12345-${lgaData.id}`
          }, geoData, auditFields)

          let [siteId] = yield knex('Site').insert(siteData)
          siteData.id = siteId
          siteDatas.push(siteData)
        }
      }
    }
  }

  // Users
  let userIds = {}
  for(let name of ['Admin', 'Bill', 'Bob', 'Frank', 'Ed', 'Fred',
      'Jason', 'Jim', 'Jon', 'Ned', 'Sam', 'Steve']){
    let userId
    if(name === 'Admin'){
      userId = adminId
    } else {
      [userId] = yield knex('User').insert({
        name: name.toLowerCase(),
        // User "Bill" was migrated from a GxAlert database.
        // Set pw to something that doesn't look like a bcrypt hash
        // so that Gx API is used to verify pw and set on aspect
        password: name === 'Bill' ? 'SOMESTRING' : bcrypt.hashSync('test07', saltRounds),
        legacyPassword: name === 'Bill' ? 1 : 0,
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0
      })
    }
    userIds[name.toLowerCase()] = userId

    let lastPartnerId = _.includes(['Jim', 'Jason'], name) ? partnerTwoId : partnerOneId
    let lastCountryId = _.includes(['Jim', 'Sam'], name) ? countries.NG.id : countries.US.id

    yield knex('Person').insert(Object.assign({
      userId,
      name,
      lastPartnerId,
      lastCountryId
    }, geoDatas[geoDatas.length % userId], auditFields))
  }

  // insert some routers with sims:
  let routerIds = []
  for (let i = 0; i < routerNumber; i++) {
    let siteData = siteDatas[i % siteDatas.length]

    let [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `Router at ${i} ${siteData.shortname}`,
      shortname: 'r'+i,
      deviceTypeId: deviceTypeIdRouter,
      siteId: siteData.id,
      createdOn: new Date(+now - 3*i*millisInHour),
      updatedOn: new Date(+now - i*millisInHour),
      lastPingOn: new Date(+now - i*millisInHour/3)
    }))

    routerIds.push(routerId)
  }

  // ... and 1-3 sims for some routers
  let sims = _.range(0, routerNumber, 2).map(i => {
    const routerId = routerIds[i]
    return Object.assign({}, auditFields, {
      deviceId: routerId,
      provider: i%3 === 0 ? 'Glo' : 'Vodafone',
      serial: 'SRL-' + routerId,
      number: '+1 413 123 45' + routerId
    })
  })
  yield knex('DeviceSim').insert(sims)

  // insert GeneXpert devices
  let devices = []
  for (let i = 0; i < deviceNumber; i++) {
    let siteData = siteDatas[i % siteDatas.length]
    let routerId = routerIds[i]

    let device = Object.assign({}, auditFields, {
      name: `D${i} ${siteData.shortname}`,
      shortname: 'd'+i,
      deviceTypeId: deviceTypeGeneXpertId,
      siteId: siteData.id,
      deviceId: routerId || null, // not all sites will have a router - we only added routers to some site
      createdOn: new Date(+now - 3*i*millisInHour),
      updatedOn: new Date(+now - i*millisInHour),
      lastPingOn: new Date(+now - i*millisInHour/3)
    })

    device.id = yield knex('Device').insert(device)

    devices.push(device)
  }

  // some samples:
  let samples = []
  for (let i = 0; i < resultMtbNumber - 100; i++) {
    let siteData = siteDatas[i % siteDatas.length]
    let sample = Object.assign({}, {
      sampleId: `SMP-${i}`,
      originSiteId: siteData.id
    })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // finally, results!
  const possibleResults = [{ resultText: 'Not Detected', category1: resultCategoryDetectedId, category2: null },
                          { resultText: 'MTB Detected, Rif Resistance Not Detected', category1: resultCategoryDetectedId, category2: resultCategoryNotDetectedId },
                          { resultText: 'MTB Detected, Rif Indeterminate', category1: resultCategoryDetectedId, category2: resultCategoryIndeterminateId },
                          { resultText: 'ERROR', category1: resultCategoryErrorId, category2: null },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId, category2: null }]

  const probes = { probes: {  probeA: 'NEG', probeB: 'POS', probeC: 'NO RESULT',
                              probeD: 'NEG', probeE: 'POS', probeSpc: 'NO RESULT',
                              qc1: 'YES', qc2: 'No',
                              probeACt: 12.32, probeBCt: 11.2, probeCCt: 12.5,
                              probeDCt: 0.5, probeECt: 1.2, probeSpcCt: 5.78,
                              qc1Ct: 1, qc2Ct: 0.007,
                              probeAEndpt: 1.6, probeBEndpt: 2.33, probeCEndpt: 457,
                              probeDEndpt: 12.43, probeEEndpt: 3.14, probeSpcEndpt: 8.9018,
                              qc1Endpt: 0.1234, qc2Endpt: 1.22 }}

  const resultsMtb = _.range(1, resultMtbNumber+1).map(i => {
    const device = devices[i % devices.length]
    const siteData = siteDatas.find((site) => { return site.id === device.siteId })
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]

    return Object.assign({}, auditFields, {
      uniqueId: 'UQ-' + i,
      assayId: assayMtbRifId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      countryId: siteData.countryId,
      stateId: siteData.stateId,
      lgaId : siteData.lgaId,
      siteId: siteData.id,
      deviceId: device.id,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      resultText: result.resultText,
      resultCategory1: result.category1,
      resultCategory2: result.category2,
      resultData: JSON.stringify(probes),
      assayVersion: '4',
      started: new Date(+now - 12*i*millisInHour),
      ended: new Date(+now - 10*i*millisInHour),
      consumableSerial: i + '12',
      consumableExpirationDate: new Date(+now + 200*i*millisInHour),
      consumableLot: 'Lot ' + i%5,
      instrumentSerial: 'S-1234-' + i%3,
      moduleName: 'Module A',
      moduleSerial: 'M-1234-' + i%4,
      researchId: 'R-ID-' + i,
      patientId: 'PAT-ID-' + i,
      senderVersion: '4.6b',
      senderOperator: 'Marsha',
      notes: 'This is a test... result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    })
  })
  yield knex('Result').insert(resultsMtb)

  // data filters
  let [dataFilterIdOH] = yield knex('DataFilter').insert({
    name: 'Ohio Filter',
    // TODO specify query constraint format (likely similar to MongoDB)
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.OH.id
      }
    })
  })

  let [dataFilterIdNE] = yield knex('DataFilter').insert({
    name: 'Nebraska Filter',
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.NE.id
      }
    })
  })

  let [dataFilterIdOHWayne] = yield knex('DataFilter').insert({
    name: 'Wayne County, OH Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.OH.lgas.Wayne.id
      }
    })
  })

  let [dataFilterIdMASuffolk] = yield knex('DataFilter').insert({
    name: 'Suffolk County, MA Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.MA.lgas.Suffolk.id
      }
    })
  })

  // Roles
  let [roleIdAdmin] = yield knex('Role').insert({
    name: 'Admin',
    partnerId: partnerOneId
  })

  let [roleIdOH] = yield knex('Role').insert({
    name: 'Ohio Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOH
  })

  let [roleIdNE] = yield knex('Role').insert({
    name: 'Nebraska Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdNE
  })

  let [roleIdOHWayne] = yield knex('Role').insert({
    name: 'Wayne County, OH Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOHWayne
  })

  let [roleIdMASuffolk] = yield knex('Role').insert({
    name: 'Suffolk County, MA Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdMASuffolk
  })

  let [roleIdParentOrgUnit] = yield knex('Role').insert({
    name: 'Partner One Users',
    partnerId: partnerOneId,
    orgUnitId: partnerOneOrgUnitId
  })

  let [roleIdNortheast] = yield knex('Role').insert({
    name: 'Northeast Users',
    partnerId: partnerOneId,
    orgUnitId: regionNortheastId
  })

  let [roleIdMidwest] = yield knex('Role').insert({
    name: 'Midwest Users',
    partnerId: partnerOneId,
    orgUnitId: regionMidwestId
  })

  // assign permissions to roles
  yield knex('RolePermission').insert([
    { roleId: roleIdAdmin, permissionId: modules.device.admin },
    { roleId: roleIdAdmin, permissionId: modules.person.admin },
    { roleId: roleIdAdmin, permissionId: modules.result.admin },
    { roleId: roleIdAdmin, permissionId: modules.site.admin },
    { roleId: roleIdAdmin, permissionId: modules.assay.admin },

    // FIXME: result permission for role

    { roleId: roleIdOH, permissionId: modules.site.edit },
    { roleId: roleIdOH, permissionId: modules.device.edit },
    { roleId: roleIdOH, permissionId: modules.assay.edit },

    { roleId: roleIdNE, permissionId: modules.site.edit },
    { roleId: roleIdNE, permissionId: modules.device.edit },

    { roleId: roleIdOHWayne, permissionId: modules.site.view },
    { roleId: roleIdOHWayne, permissionId: modules.device.view },
    { roleId: roleIdOHWayne, permissionId: modules.assay.view },

    { roleId: roleIdMASuffolk, permissionId: modules.device.view },

    { roleId: roleIdMidwest, permissionId: modules.site.edit },
    { roleId: roleIdMidwest, permissionId: modules.device.edit },

    { roleId: roleIdNortheast, permissionId: modules.site.edit },
    { roleId: roleIdNortheast, permissionId: modules.device.edit },

    { roleId: roleIdParentOrgUnit, permissionId: modules.site.edit },
    { roleId: roleIdParentOrgUnit, permissionId: modules.device.edit }
  ])


  // assign roles to users
  yield knex('UserRole').insert([
    { userId: userIds['admin'], roleId: roleIdAdmin },
    { userId: userIds['bob'], roleId: roleIdOH },
    { userId: userIds['ed'], roleId: roleIdMidwest },
    { userId: userIds['frank'], roleId: roleIdNE },
    { userId: userIds['fred'], roleId: roleIdOHWayne },
    { userId: userIds['jon'], roleId: roleIdParentOrgUnit },
    { userId: userIds['ned'], roleId: roleIdNortheast },
    { userId: userIds['sam'], roleId: roleIdAdmin },
    { userId: userIds['jim'], roleId: roleIdParentOrgUnit },
    { userId: userIds['steve'], roleId: roleIdMASuffolk },
    { userId: userIds['bill'], roleId: roleIdMASuffolk },
    { userId: userIds['bill'], roleId: roleIdOH }])

}
