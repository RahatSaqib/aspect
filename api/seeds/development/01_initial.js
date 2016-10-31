module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const millisInHour = 1000*60*60
const deviceNumber = 50
const routerNumber = 20
const resultMtbNumber = 200
const resultEbolaNumber = 100
const resultHivVlNumber = 50
const saltRounds = parseInt(config.passwordSaltRounds)

function* seed(knex){
  // Create admin user and audit fields
  const now = new Date(),
    [adminId] = yield knex('User').insert({
      name: 'admin',
      password: bcrypt.hashSync('test07', saltRounds),
      approved: 1,
      createdOn: now,
      lockedOut: 0,
      failedPasswordAttempts: 0
    }), auditFields = {
      createdOn: now,
      createdBy: adminId,
      updatedOn: now,
      updatedBy: adminId
    }

  // Create partner types
  const partnerTypeFundingId = yield knex('PartnerType').insert({
      name: 'Funding'
    }), partnerTypeImplementingId = yield knex('PartnerType').insert({
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

  const [partnerTwoId] = yield knex('Partner').insert({
      name: 'Partner Two',
      partnerTypeId: partnerTypeImplementingId
    }), [partnerOneOrgUnitId] = yield knex('OrgUnit').insert({
      name: 'Partner One',
      partnerId: partnerOneId,
      depth: 1,
      leftBound: 1,
      rightBound: 6
    }), [regionNortheastId] = yield knex('OrgUnit').insert({
      name: 'Northeast',
      partnerId: partnerOneId,
      depth: 2,
      leftBound: 2,
      rightBound: 3
    }), [regionMidwestId] = yield knex('OrgUnit').insert({
      name: 'Midwest',
      partnerId: partnerOneId,
      depth: 2,
      leftBound: 4,
      rightBound: 5
    }),
    // Categories of devices (lab, connectivity...)
    [deviceTypeCategoryLab] = yield knex('DeviceTypeCategory').insert({
      name: 'Lab',
      hasConnectivity: 0,
      hasResults: 1
    }), [deviceTypeCategoryConnectivity] = yield knex('DeviceTypeCategory').insert({
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
  const [deviceTypeGeneXpertId] = yield knex('DeviceType').insert({
      name: 'GeneXpert',
      manufacturer: 'Cepheid',
      deviceTypeCategoryId: deviceTypeCategoryLab
    }), [deviceTypeAfinionId] = yield knex('DeviceType').insert({
      name: 'Afinion',
      manufacturer: 'Alere',
      deviceTypeCategoryId: deviceTypeCategoryLab
    }), [deviceTypeQId] = yield knex('DeviceType').insert({
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

  let [assayTypeHivVlId] = yield knex('AssayType').insert({
    name: 'HIV VL',
    i18nKey: 'AssayTypeHivVl'
  })

  let [assayTypeLipidPanelId] = yield knex('AssayType').insert({
    name: 'Lipid Panel',
    i18nKey: 'AssayTypeLipidPanel'
  })

  // define resultData object
  const geneXpertResultDataSchema = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string',
      list: true
    },
    probes: {
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
      }
    }
  })

  const geneXpertResultDataSchemaHiv = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string',
      i18nKey: 'ResultText'
    },
    copies: {
      title: 'Copies/mL',
      type: 'number'
    },
    log: {
      title: 'log',
      type: 'number'
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'Probes',
      properties: {
        'gpCt': {
          title: 'GP Ct',
          type: 'number'
        },
        'gpEndPt': {
          title: 'GP Endpt',
          type: 'number'
        },
        'cicCt': {
          title: 'CIC Ct',
          type: 'number'
        },
        'cicEndPt': {
          title: 'CIC EndPt',
          type: 'number'
        },
        'sacCt': {
          title: 'SAC Ct',
          type: 'number'
        },
        'sacEndPt': {
          title: 'SAC EndPt',
          type: 'number'
        },
        'npCt': {
          title: 'NP Ct',
          type: 'number'
        },
        'npEndPt': {
          title: 'NP EndPt',
          type: 'number'
        },
        'qc1Ct': {
          title: 'QC1 Ct',
          type: 'number'
        },
        'qc1Endpt': {
          title: 'QC1 EndPt',
          type: 'number'
        },
        'qc2Ct': {
          title: 'QC2 Ct',
          type: 'number'
        },
        'qc2Endpt': {
          title: 'Qc2Endpt',
          type: 'number'
        }
      }
    }
  })

  const [assayMtbRifId] = yield knex('Assay').insert({
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

  const [assayHivVlId] = yield knex('Assay').insert({
    name: 'GeneXpert HIV VL',
    i18nKey: 'AssayGeneXpertHivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'ResultCategoryMtb',
    resultCategory2Label: 'Rif',
    resultCategory2i18nKey: 'ResultCategoryRif',
    resultDataSchema: geneXpertResultDataSchemaHiv
  })

  const [assayEbolaId] = yield knex('Assay').insert({
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
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeAfinionId,
    resultDataSchema: JSON.stringify({
      copies: {
        title: 'copies/mL',
        type: 'number',
        list: true
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
        unit: 'mmol/L',
        list: true
      },
      trig: {
        title: 'Trig (mmol/L)',
        type: 'number',
        unit: 'mmol/L',
        list: true
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
    assayTypeId: assayTypeHivVlId,
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

  const [resultCategorySuccessId] = yield knex('ResultCategory').insert({
    name: 'Success',
    i18nKey: 'ResultCategorySuccess'
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

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategorySuccessId,
    assayId: assayHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayHivVlId
  })


  // Units
  let [piece] = yield knex('Units').insert({
    name: 'Piece',
    shortName: 'pc'
  })

  let [liter] = yield knex('Units').insert({
    name: 'Liter',
    shortName: 'l'
  })

  let [milliliter] = yield knex('Units').insert({
    name: 'Milliliter',
    shortName: 'ml'
  })

  let [milligram] = yield knex('Units').insert({
    name: 'Milligram',
    shortName: 'mg'
  })

  let [gram] = yield knex('Units').insert({
    name: 'Gram',
    shortName: 'g'
  })

  let [kilogram] = yield knex('Units').insert({
    name: 'Kilogram',
    shortName: 'kg'
  })

  let [ounce] = yield knex('Units').insert({
    name: 'Ounce',
    shortName: 'oz'
  })

  // Consumable types
  yield knex('Consumable').insert({
    name: 'Gloves',
    unit: piece,
    canExpire: 0,
    manufacturer: 'ABC Company',
    autoInclude: 1
  })
  yield knex('Consumable').insert({
    name: 'GeneXpert TB Cartridge',
    unit: ounce,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0
  })

  // Create permissions
  const modules = {}
  for(let module of permissions.modules){
    const moduleData = {}
    modules[module.name] = moduleData
    for(let activity of module.activities){
      const [permissionId] = yield knex('Permission').insert({
        module: module.name,
        activity
      })
      moduleData[activity] = permissionId
    }
  }

  // Create geographic hierarchy
  const countries = {},
    geoDatas = [],
    siteDatas = []
  for(let country of geography.countries){
    const countryData = _.pick(country, [
      'abbreviation', 'name', 'a3', 'culture', 'countryCode',
      'stateLabel', 'lgaLabel', 'timezone', 'portNumber',
      'exportColumns', 'inventoryDaysThreshold', 'monthStartsOnDay'])
    const [countryId] = yield knex('Country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    countryData.states = {}

    for(let state of (country.states || [])){
      const stateData = Object.assign(
        {countryId: countryData.id},
        _.pick(state, ['abbreviation', 'name']))
      const [stateId] = yield knex('State').insert(stateData)
      stateData.id = stateId
      const stateKey = state.abbreviation || state.name
      countryData.states[stateKey] = stateData
      stateData.lgas = {}

      // assign org units based on state region
      const orgUnitId = _.includes(['OH', 'NE'], state.abbreviation) ? regionMidwestId
        : _.includes(['MA', 'NY'], state.abbreviation) ? regionNortheastId
        : partnerOneOrgUnitId

      for(let lga of (state.lgas || [])){
        const lgaData = Object.assign(
          {stateId: stateData.id},
          _.pick(lga, ['name'])),
          [lgaId] = yield knex('Lga').insert(lgaData)
        lgaData.id = lgaId
        stateData.lgas[lga.name] = lgaData
        lgaData.sites = {}

        const geoData = {
          countryId: countryData.id,
          stateId: stateData.id,
          lgaId: lgaData.id
        }
        geoDatas.push(geoData)

        // up to 5 of sites at each LGA
        for(let siteNumber of _.range(1, 6 - (lgaData.id % 5))){
          const siteData = Object.assign({
              partnerId: partnerOneId,
              orgUnitId,
              name: `${lga.name} ${country.lgaLabel} ${state.name} #${siteNumber}`,
              shortname: `${lga.name}, ${stateKey} #${siteNumber}`,
              identifier: `Site ${siteNumber * lgaData.id}`,
              city: `${lga.name} City`,
              street1: `${lgaData.id} Main Street`,
              zip: `12345-${lgaData.id}`
            }, geoData, auditFields),
            [siteId] = yield knex('Site').insert(siteData)
          siteData.id = siteId
          siteDatas.push(siteData)
        }
      }
    }
  }

  // Users
  const userIds = {}
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

    const lastPartnerId = _.includes(['Jim', 'Jason'], name) ? partnerTwoId : partnerOneId,
      lastCountryId = _.includes(['Jim', 'Sam'], name) ? countries.NG.id : countries.US.id,
      timezone = _.includes(['Jim', 'Sam'], name) ? countries.NG.timezone : countries.US.timezone,
      culture = _.includes(['Jim', 'Sam'], name) ? countries.NG.culture : countries.US.culture

    yield knex('Person').insert(Object.assign({
      userId,
      name,
      lastPartnerId,
      lastCountryId,
      timezone,
      culture
    }, geoDatas[geoDatas.length % userId], auditFields))
  }

  // insert some routers with sims:
  let routerIds = []
  for (let i = 0; i < routerNumber; i++) {
    const siteData = siteDatas[i % siteDatas.length],
      [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
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
  const devices = []
  for (let i = 0; i < deviceNumber; i++) {
    const siteData = siteDatas[i % siteDatas.length],
      routerId = routerIds[i],
      device = Object.assign({}, auditFields, {
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

    // Create API Keys
    yield knex('DeviceApiKey').insert(Object.assign({
      deviceId: device.id,
      revoked: device.id % 5 === 0
    }, auditFields))
  }

  // some TB samples:
  let samples = []
  for (let i = 0; i < resultMtbNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length],
      sample = Object.assign({}, {
        sampleId: `SMP-TB-${i}`,
        originSiteId: siteData.id
      })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // TB results:
  let possibleResults = [{ resultText: 'Not Detected', category1: resultCategoryDetectedId, category2: null },
                          { resultText: 'MTB Detected, Rif Resistance Not Detected', category1: resultCategoryDetectedId, category2: resultCategoryNotDetectedId },
                          { resultText: 'MTB Detected, Rif Indeterminate', category1: resultCategoryDetectedId, category2: resultCategoryIndeterminateId },
                          { resultText: 'ERROR', category1: resultCategoryErrorId, category2: null },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId, category2: null }]

  let resultData = { probes: {  probeA: 'NEG', probeB: 'POS', probeC: 'NO RESULT',
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
    resultData.resultText = result.resultText

    return Object.assign({}, auditFields, {
      uniqueId: 'UQTB-' + i,
      assayId: assayMtbRifId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      countryId: siteData.countryId,
      stateId: siteData.stateId,
      lgaId : siteData.lgaId,
      siteId: siteData.id,
      deviceId: device.id,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      resultCategory1: result.category1,
      resultCategory2: result.category2,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - 12*i*millisInHour),
      endedOn: new Date(+now - 10*i*millisInHour),
      consumableSerial: i + '12',
      consumableExpirationDate: new Date(+now + 200*i*millisInHour),
      consumableLot: 'Lot ' + i%5,
      instrumentSerial: 'S-1234-' + i%3,
      moduleName: 'Module A',
      moduleSerial: 'M-1234-' + i%4,
      researchId: 'R-ID-' + i,
      patientId: 'TB-PAT-ID-' + i,
      senderVersion: '4.6b',
      senderOperator: 'Marsha',
      notes: 'This is a test... result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    })
  })
  yield knex('Result').insert(resultsMtb)

  // some Ebola samples:
  samples = []
  for (let i = 0; i < resultEbolaNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length],
      sample = Object.assign({}, {
        sampleId: `SMP-EB-${i}`,
        originSiteId: siteData.id
      })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // Ebola results:
  possibleResults = [{ resultText: 'Ebola GP NON DÉTECTÉ|Ebola NP NON DÉTECTÉ', category1: resultCategoryNotDetectedId, category2: resultCategoryNotDetectedId },
                          { resultText: 'Ebola GP DÉTECTÉ|Ebola NP NON DÉTECTÉ', category1: resultCategoryDetectedId, category2: resultCategoryNotDetectedId },
                          { resultText: 'Ebola GP Not Detected|Ebola NP Detected', category1: resultCategoryNotDetectedId, category2: resultCategoryDetectedId },
                          { resultText: 'No Result', category1: resultCategoryNoResultId, category2: null },
                          { resultText: 'ERROR', category1: resultCategoryErrorId, category2: null },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId, category2: null }]

  resultData = { probes: {  probeA: null, probeB: null, probeC: null,
                              probeD: null, probeE: null, probeSpc: null,
                              qc1: null, qc2: null,
                              probeACt: 0.32, probeBCt: 0, probeCCt: 11.4,
                              probeDCt: 0.5, probeECt: 1.2, probeSpcCt: null,
                              qc1Ct: 1, qc2Ct: 0.007,
                              probeAEndpt: 1.6, probeBEndpt: 2.33, probeCEndpt: 457,
                              probeDEndpt: 12.43, probeEEndpt: 3.14, probeSpcEndpt: null,
                              qc1Endpt: 0.1234, qc2Endpt: 1.22 }}

  const resultsEbola = _.range(1, resultEbolaNumber+1).map(i => {
    const device = devices[i % devices.length]
    const siteData = siteDatas.find((site) => { return site.id === device.siteId })
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    resultData.resultText = result.resultText

    return Object.assign({}, auditFields, {
      uniqueId: 'UQEB-' + i,
      assayId: assayEbolaId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      countryId: siteData.countryId,
      stateId: siteData.stateId,
      lgaId : siteData.lgaId,
      siteId: siteData.id,
      deviceId: device.id,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      resultCategory1: result.category1,
      resultCategory2: result.category2,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - 12*i*millisInHour),
      endedOn: new Date(+now - 10*i*millisInHour),
      consumableSerial: i + '12',
      consumableExpirationDate: new Date(+now + 200*i*millisInHour),
      consumableLot: 'Lot ' + i%5,
      instrumentSerial: 'S-1234-' + i%3,
      moduleName: 'Module A',
      moduleSerial: 'M-1234-' + i%4,
      researchId: 'R-ID-' + i,
      patientId: 'EB-PAT-ID-' + i,
      senderVersion: '4.7a',
      senderOperator: 'Marsha',
      notes: 'This is an Ebola test result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    })
  })
  yield knex('Result').insert(resultsEbola)

  // some HIV VL samples:
  samples = []
  for (let i = 0; i < resultHivVlNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length],
      sample = Object.assign({}, {
        sampleId: `SMP-HIV-${i}`,
        originSiteId: siteData.id
      })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // HIV VL esults:
  possibleResults = [{ resultText: 'HIV-1 DÉTECTÉ {0} copies/mL (log {1})', category1: resultCategoryDetectedId },
                          { resultText: 'HIV-1 NON DÉTECTÉ', category1: resultCategoryNotDetectedId },
                          { resultText: 'No Result', category1: resultCategoryNoResultId },
                          { resultText: 'ERROR', category1: resultCategoryErrorId },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId }]

  resultData = {  probes: {  gpCt: 25.40, gpEndPt: 558.00, cicCt: 23.90,
                        cicEndPt: 289.00, sacCt: 33.80, sacEndPt: 650.00,
                        npCt: 12.2, npEndPt: null,
                        qc1Ct: 0.32, qc1Endpt: 0, qc2Ct: 11.4,
                        qc2Endpt: 0.5 }}

  const resultsHiv = _.range(1, resultHivVlNumber+1).map(i => {
    const device = devices[i % devices.length]
    const siteData = siteDatas.find((site) => { return site.id === device.siteId })
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    let copies = 3200
    let log = 5
    if (result === possibleResults[0]){
      copies = Math.floor(Math.random() * 500000)
      log = Math.round(Math.random() * 600) / 100
    } else {
      copies = null
      log = null
    }

    resultData.copies = copies
    resultData.log = log
    resultData.resultText = result.resultText.replace('{0}', copies).replace('{1}', log)

    return Object.assign({}, auditFields, {
      uniqueId: 'UQHIV-' + i,
      assayId: assayHivVlId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      countryId: siteData.countryId,
      stateId: siteData.stateId,
      lgaId : siteData.lgaId,
      siteId: siteData.id,
      deviceId: device.id,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      resultCategory1: result.category1,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - 12*i*millisInHour),
      endedOn: new Date(+now - 10*i*millisInHour),
      consumableSerial: i + '12',
      consumableExpirationDate: new Date(+now + 200*i*millisInHour),
      consumableLot: 'Lot ' + i%5,
      instrumentSerial: 'S-1234-' + i%3,
      moduleName: 'Module A',
      moduleSerial: 'M-1234-' + i%4,
      researchId: 'R-ID-' + i,
      patientId: 'HIV-PAT-ID-' + i,
      senderVersion: '4.4',
      senderOperator: 'Marsha',
      notes: 'This is an HIV test result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    })
  })
  yield knex('Result').insert(resultsHiv)

  // data filters
  const [dataFilterIdOH] = yield knex('DataFilter').insert({
    name: 'Ohio Filter',
    // TODO specify query constraint format (likely similar to MongoDB)
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.OH.id
      }
    })
  })

  const [dataFilterIdNE] = yield knex('DataFilter').insert({
    name: 'Nebraska Filter',
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.NE.id
      }
    })
  })

  const [dataFilterIdOHWayne] = yield knex('DataFilter').insert({
    name: 'Wayne County, OH Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.OH.lgas.Wayne.id
      }
    })
  })

  const [dataFilterIdMASuffolk] = yield knex('DataFilter').insert({
    name: 'Suffolk County, MA Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.MA.lgas.Suffolk.id
      }
    })
  })

  // Roles
  const [roleIdAdmin] = yield knex('Role').insert({
    name: 'Admin',
    partnerId: partnerOneId
  })

  const [roleIdOH] = yield knex('Role').insert({
    name: 'Ohio Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOH
  })
  const [roleIdNE] = yield knex('Role').insert({
    name: 'Nebraska Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdNE
  })

  const [roleIdOHWayne] = yield knex('Role').insert({
    name: 'Wayne County, OH Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOHWayne
  })

  const [roleIdMASuffolk] = yield knex('Role').insert({
    name: 'Suffolk County, MA Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdMASuffolk
  })

  const [roleIdParentOrgUnit] = yield knex('Role').insert({
    name: 'Partner One Users',
    partnerId: partnerOneId,
    orgUnitId: partnerOneOrgUnitId
  })

  const [roleIdNortheast] = yield knex('Role').insert({
    name: 'Northeast Users',
    partnerId: partnerOneId,
    orgUnitId: regionNortheastId
  })

  const [roleIdMidwest] = yield knex('Role').insert({
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
    { roleId: roleIdAdmin, permissionId: modules.inventory.admin },

    // FIXME: result permission for role

    { roleId: roleIdOH, permissionId: modules.site.edit },
    { roleId: roleIdOH, permissionId: modules.device.edit },
    { roleId: roleIdOH, permissionId: modules.assay.edit },
    { roleId: roleIdOH, permissionId: modules.inventory.edit},

    { roleId: roleIdNE, permissionId: modules.site.edit },
    { roleId: roleIdNE, permissionId: modules.device.edit },


    { roleId: roleIdOHWayne, permissionId: modules.site.view },
    { roleId: roleIdOHWayne, permissionId: modules.device.view },
    { roleId: roleIdOHWayne, permissionId: modules.assay.view },
    {roleId: roleIdOHWayne, permissionId: modules.inventory.view},

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
