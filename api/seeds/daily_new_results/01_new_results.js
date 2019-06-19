module.exports = require('../utils').seed(seed)
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const _ = require('lodash')
const {
  addMilliseconds,
  addMinutes,
  addHours,
  subHours,
  subDays,
} = require('date-fns')

const {
  allResultCategoryToId,
  allResultWorkflowStatusToId,
  allResultSourceToId,
  allSampleTypeToId,
  resultTypeToId,
} = require('../../src/shared/dictionary')

const patientNumber = patients.length - 1
const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 365
const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultMtbNumber = 1 * resultMultiplier
const resultEbolaNumber = 0.5 * resultMultiplier
const resultHivVlNumber = 0.5 * resultMultiplier
const resultHcvNumber = 0.5 * resultMultiplier
const now = new Date()

function calculateDateForResult(
  currentResult,
  totalResults,
  randomMillisToAdd
) {
  const daysToSubtract =
    resultTimeFrameInDays -
    Math.ceil((currentResult / totalResults) * resultTimeFrameInDays)

  return addMilliseconds(
    subDays(now, daysToSubtract),
    _.random(randomMillisToAdd)
  )
}

async function seed(knex) {
  const {
    DBS: sampleTypeDBSId,
    Plasma: sampleTypePlasmaId,
  } = await allSampleTypeToId()
  // Create admin user and audit fields
  const users = await knex('User').select('*')
  const adminId = _.sample(users).id
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Result types
  const resultTypePatientId = await resultTypeToId('Patient')

  // result categories
  const {
    Detected: resultCategoryDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    Indeterminate: resultCategoryIndeterminateId,
    Invalid: resultCategoryInvalidId,
    NoResult: resultCategoryNoResultId,
    Error: resultCategoryErrorId,
  } = await allResultCategoryToId()

  // Result Workflow Status
  const {
    Ordered: ordered,
    Processed: processed,
    Validated: validated,
    Deliverable: deliverable,
    Acknowledged: acknowledged,
  } = await allResultWorkflowStatusToId()

  const siteDatas = []

  // Results section
  // TB results:
  let possibleResults = [
    {
      resultText: 'MTB Detected, Rif Resistance Not Detected',
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      minLikelihood: 0,
      maxLikelihood: 20,
    },
    {
      resultText: 'MTB Detected, Rif Resistance Detected',
      category1: resultCategoryDetectedId,
      category2: resultCategoryDetectedId,
      minLikelihood: 21,
      maxLikelihood: 26,
    },
    {
      resultText: 'MTB Detected, Rif Indeterminate',
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
      category1: resultCategoryDetectedId,
      category2: null,
      minLikelihood: 39,
      maxLikelihood: 100,
    },
  ]

  let resultData = {
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
  // Create partner types

  const partnerOneId = await knex('Partner').first()
  const deviceTypes = await knex('DeviceType').select()
  // const assayTypes = await knex('AssayType').select()
  const assays = await knex('Assay').select()
  const { id: assayGeneXpertMtbRifId } = _.find(
    assays,
    elem => elem.externalId === 'GxMtbRif'
  )
  const deviceTypeGeneXpertId = _.find(
    deviceTypes,
    elem => elem.externalId === 'CepheidGeneXpert'
  ).id
  const devicesGeneXpert = knex('Device')
    .where({ deviceTypeId: deviceTypeGeneXpertId })
    .first()
  const lastSampleId = knex('Sample')
    .orderby('id', 'desc')
    .first('id')
  // some TB samples:
  let samples = []
  await Promise.all(
    _.map(_.range(resultMtbNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-TB-${i + lastSampleId}`,
          collectedOn: calculateDateForResult(
            i,
            resultMtbNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )
  const {
    DiagnosticDevice: resultSourceDiagnosticId,
  } = await allResultSourceToId()
  _.map(_.range(resultMtbNumber), async i => {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultMtbNumber, 6000)

    // Result source

    const rnd = _.random(0, 100)
    const result = _.find(
      possibleResults,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )
    const patientNumber = patients.length - 1
    resultData.resultText = result.resultText
    const resultId = await knex('Result').insert(
      Object.assign({}, auditFields, {
        externalId: `UQTB-${i}`,
        assayId: assayGeneXpertMtbRifId,
        partnerId: partnerOneId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        deviceId: device.id,
        longitude: -81.581222,
        latitude: 28.419348,
        resultSourceId: resultSourceDiagnosticId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        sampleRunNumber: `${(i % 2) + 1}`,
        sampleGroup: `GRP-HIV-${i % 5}`,
        resultCategory1: result.category1,
        resultCategory2: result.category2,
        resultData: JSON.stringify(resultData),
        assayVersion: '4',
        startedOn: randomDate,
        endedOn: addMinutes(randomDate, 100),
        createdOn: addMinutes(randomDate, 120),
        updatedOn: addMinutes(randomDate, 180),
        consumableSerial: `${i}12`,
        consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
        consumableLot: `Lot ${i % 5}`,
        instrumentSerial: `S-1234-${i % 3}`,
        moduleName: 'Module A',
        moduleSerial: `M-1234-${i % 4}`,
        researchId: `R-ID-${i}`,
        patientData: JSON.stringify(patients[_.random(patientNumber)]),
        senderVersion: '4.6b',
        senderOperator: 'Marsha',
        notes: 'This is a test... result',
        errorCode:
          result.category1 === resultCategoryErrorId
            ? errorCodes[_.random(errorCodes.length)]
            : null,
        errorNotes:
          result.category1 === resultCategoryErrorId
            ? 'Exceeded cycle threshold'
            : null,
      })
    )

    const [lastLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: ordered,
      operator: 'Marsha',
      changedOn: subHours(randomDate, 25),
      createdOn: subHours(randomDate, 26),
      createdBy: adminId,
    })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: acknowledged,
      operator: 'John',
      changedOn: addHours(randomDate, 2),
      createdOn: addHours(randomDate, 1),
      createdBy: adminId,
    })

    await knex('Result')
      .where('id', resultId)
      .update({ resultWorkflowStatusLogId: lastLogId })
  })

  // some Ebola samples:
  await Promise.all(
    _.map(_.range(resultEbolaNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-EB-${i + lastSampleId}`,
          collectedOn: calculateDateForResult(
            i,
            resultEbolaNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypePlasmaId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // Ebola results:
  possibleResults = [
    {
      resultText: 'Ebola GP NON DÉTECTÉ|Ebola NP NON DÉTECTÉ',
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
    },
    {
      resultText: 'Ebola GP DÉTECTÉ|Ebola NP NON DÉTECTÉ',
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
    },
    {
      resultText: 'Ebola GP Not Detected|Ebola NP Detected',
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryDetectedId,
    },
    {
      resultText: 'No Result',
      category1: resultCategoryNoResultId,
      category2: null,
    },
    { resultText: 'ERROR', category1: resultCategoryErrorId, category2: null },
    {
      resultText: 'Invalid',
      category1: resultCategoryInvalidId,
      category2: null,
    },
  ]

  resultData = {
    probes: {
      probeA: null,
      probeB: null,
      probeC: null,
      probeD: null,
      probeE: null,
      probeSpc: null,
      qc1: null,
      qc2: null,
      probeACt: 0.32,
      probeBCt: 0,
      probeCCt: 11.4,
      probeDCt: 0.5,
      probeECt: 1.2,
      probeSpcCt: null,
      qc1Ct: 1,
      qc2Ct: 0.007,
      probeAEndpt: 1.6,
      probeBEndpt: 2.33,
      probeCEndpt: 457,
      probeDEndpt: 12.43,
      probeEEndpt: 3.14,
      probeSpcEndpt: null,
      qc1Endpt: 0.1234,
      qc2Endpt: 1.22,
    },
  }
  const assayGeneXpertEbolaId = _.find(
    assays,
    elem => elem.externalId === 'GxEbola'
  )
  _.map(_.range(resultEbolaNumber), async i => {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultEbolaNumber, 6000)
    // Result source
    const {
      DiagnosticDevice: resultSourceDiagnosticId,
    } = await allResultSourceToId()
    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(5) === 0) {
          resultData.resultText = result.resultText
          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQEB-${i}-${j}`,
              assayId: assayGeneXpertEbolaId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${(i % 2) + 1}`,
              resultCategory1: result.category1,
              sampleGroup: `GRP-HIV-${i % 5}`,
              resultCategory2: result.category2,
              resultData: JSON.stringify(resultData),
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 100),
              createdOn: addMinutes(randomDate, 120),
              updatedOn: addMinutes(randomDate, 180),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(patientNumber)]),
              senderVersion: '4.7a',
              senderOperator: 'Marsha',
              notes: 'This is an Ebola test result',
              errorCode:
                result.category1 === resultCategoryErrorId
                  ? errorCodes[_.random(errorCodes.length)]
                  : null,
              errorNotes:
                result.category1 === resultCategoryErrorId
                  ? 'Exceeded cycle threshold'
                  : null,
            })
          )

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: ordered,
            operator: 'Bill',
            changedOn: subHours(randomDate, 34),
            createdOn: subHours(randomDate, 35),
            createdBy: adminId,
          })

          const [lastLogId] = await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: processed,
            operator: 'Marsha',
            changedOn: subHours(randomDate, 13),
            createdOn: subHours(randomDate, 12),
            createdBy: adminId,
          })

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: acknowledged,
            operator: 'John',
            changedOn: addHours(randomDate, 41),
            createdOn: addHours(randomDate, 42),
            createdBy: adminId,
          })

          await knex('Result')
            .where('id', resultId)
            .update({ resultWorkflowStatusLogId: lastLogId })
        }
      })
    )
  })

  // some HIV VL samples:
  samples = []
  await Promise.all(
    _.map(_.range(resultHivVlNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HIV-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHivVlNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // HIV VL Results for the GeneXpert:
  possibleResults = [
    {
      resultText: 'HIV-1 DÉTECTÉ {0} copies/mL (log {1})',
      category1: resultCategoryDetectedId,
    },
    { resultText: 'HIV-1 NON DÉTECTÉ', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'ERROR', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
    probes: {
      gpCt: 25.4,
      gpEndPt: 558.0,
      cicCt: 23.9,
      cicEndPt: 289.0,
      sacCt: 33.8,
      sacEndPt: 650.0,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5,
    },
  }

  _.map(_.range(resultHivVlNumber), async i => {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

    // make sure we have at least one result with these status
    const ensureResultIds = [acknowledged, validated, deliverable]
    let j = 0

    const assayGeneXpertHiv1VlId = _.find(
      assays,
      elem => elem.externalId === 'GxHiv1Vl'
    )
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let copies = 3200
          let log = 5
          if (result === possibleResults[0]) {
            copies = Math.floor(Math.random() * 500000)
            log = Math.round(Math.random() * 600) / 100
          } else {
            copies = null
            log = null
          }

          resultData.copies = copies
          resultData.log = log
          resultData.resultText = result.resultText
            .replace('{0}', copies)
            .replace('{1}', log)

          const resultStatus =
            ensureResultIds.shift() || _.random(1) < 0.3
              ? acknowledged
              : _.random(1) < 0.5
              ? validated
              : deliverable

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQHIV-${i}-${j}`,
              assayId: assayGeneXpertHiv1VlId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${(i % 2) + 1}`,
              resultCategory1: result.category1,
              resultData: JSON.stringify(resultData),
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 92),
              createdOn: addMinutes(randomDate, 100),
              updatedOn: addMinutes(randomDate, 120),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(patientNumber)]),
              senderVersion: '4.4',
              senderOperator: 'Marsha',
              notes: 'This is an HIV test result',
              errorCode:
                result.category1 === resultCategoryErrorId
                  ? errorCodes[_.random(errorCodes.length)]
                  : null,
              errorNotes:
                result.category1 === resultCategoryErrorId
                  ? 'Exceeded cycle threshold'
                  : null,
            })
          )

          const [lastLogId] = await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: resultStatus,
            operator: 'Marsha',
            changedOn: subHours(randomDate, 2),
            createdOn: subHours(randomDate, 3),
            createdBy: adminId,
          })
          await knex('Result')
            .where('id', resultId)
            .update({ resultWorkflowStatusLogId: lastLogId })
        }
      })
    )
  })

  // some HCV samples for GeneXpert
  samples = []
  await Promise.all(
    _.map(_.range(resultHcvNumber / 2), async i => {
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HCV-GX-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHcvNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // Daktari HCV Results:
  possibleResults = [
    { resultText: 'HCV Detected - {0}', category1: resultCategoryDetectedId },
    { resultText: 'HCV Not Detected', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'Error', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
    probes: {
      gpCt: 25.4,
      gpEndPt: 558.0,
      cicCt: 23.9,
      cicEndPt: 289.0,
      sacCt: 33.8,
      sacEndPt: 650.0,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5,
    },
  }

  _.map(_.range(resultHcvNumber), async i => {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHcvNumber, 6000)

    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let count = 3200
          if (result === possibleResults[0]) {
            count = Math.floor(Math.random() * 100000000)
          } else {
            count = null
          }

          resultData.count = count
          resultData.resultText = result.resultText.replace('{0}', count)

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQ-GX-HCV-${i}-${j}`,
              assayId: assayGeneXpertHcvId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${(i % 2) + 1}`,
              sampleGroup: `GRP-HIV-${i % 5}`,
              resultCategory1: result.category1,
              resultData: JSON.stringify(resultData),
              assayVersion: '4.7',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 80),
              createdOn: addMinutes(randomDate, 100),
              updatedOn: addMinutes(randomDate, 120),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(patientNumber)]),
              senderVersion: '4.7b',
              senderOperator: 'Gene Hackman',
              notes: 'This is an HCV test result',
              errorCode:
                result.category1 === resultCategoryErrorId
                  ? errorCodes[_.random(errorCodes.length)]
                  : null,
              errorNotes:
                result.category1 === resultCategoryErrorId
                  ? 'Exceeded cycle threshold'
                  : null,
            })
          )

          const [lastLogId] = await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: processed,
            operator: 'Gene Hackman',
            changedOn: addMinutes(randomDate, 90),
            createdOn: addMinutes(randomDate, 90),
            createdBy: adminId,
          })
          await knex('Result')
            .where('id', resultId)
            .update({ resultWorkflowStatusLogId: lastLogId })
        }
      })
    )
  })

  // some HIV VL samples for Daktari
  samples = []
  await Promise.all(
    _.map(_.range(resultHivVlNumber), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HIV-DAK-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHivVlNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // HIV VL Results for the GeneXpert:
  possibleResults = [
    {
      resultText: 'HIV Detected (log {1})',
      category1: resultCategoryDetectedId,
    },
    { resultText: 'HIV Not Detected', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'Error', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
    probes: {
      gpCt: 25.4,
      gpEndPt: 558.0,
      cicCt: 23.9,
      cicEndPt: 289.0,
      sacCt: 33.8,
      sacEndPt: 650.0,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5,
    },
  }

  _.map(_.range(resultHivVlNumber), async i => {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let copies = 3200
          let log = 5
          if (result === possibleResults[0]) {
            copies = Math.floor(Math.random() * 500000)
            log = Math.round(Math.random() * 600) / 100
          } else {
            copies = null
            log = null
          }

          resultData.copies = copies
          resultData.log = log
          resultData.resultText = result.resultText
            .replace('{0}', copies)
            .replace('{1}', log)

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQ-DAK-HIV-${i}-${j}`,
              assayId: assayDaktariHivVlId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${(i % 2) + 1}`,
              sampleGroup: `GRP-HIV-${i % 5}`,
              resultCategory1: result.category1,
              resultData: JSON.stringify(resultData),
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 48),
              createdOn: addMinutes(randomDate, 60),
              updatedOn: addMinutes(randomDate, 80),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(patientNumber)]),
              senderVersion: '4.4',
              senderOperator: 'Aaron',
              notes: 'This is an HIV test result',
              errorCode:
                result.category1 === resultCategoryErrorId
                  ? errorCodes[_.random(errorCodes.length)]
                  : null,
              errorNotes:
                result.category1 === resultCategoryErrorId
                  ? 'Exceeded cycle threshold'
                  : null,
            })
          )

          const [lastLogId] = await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: acknowledged,
            operator: 'Aaron',
            changedOn: addMinutes(randomDate, 90),
            createdOn: addMinutes(randomDate, 90),
            createdBy: adminId,
          })
          await knex('Result')
            .where('id', resultId)
            .update({ resultWorkflowStatusLogId: lastLogId })
        }
      })
    )
  })

  // some HCV samples for Daktari
  samples = []
  await Promise.all(
    _.map(_.range(resultHcvNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HCV-DAK-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHcvNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // Daktari HCV Results:
  possibleResults = [
    {
      resultText: 'HCV Detected (log {1})',
      category1: resultCategoryDetectedId,
    },
    { resultText: 'HCV Not Detected', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'Error', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
    probes: {
      gpCt: 25.4,
      gpEndPt: 558.0,
      cicCt: 23.9,
      cicEndPt: 289.0,
      sacCt: 33.8,
      sacEndPt: 650.0,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5,
    },
  }

  _.map(_.range(resultHcvNumber), async i => {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHcvNumber, 6000)

    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let copies = 3200
          let log = 5
          if (result === possibleResults[0]) {
            copies = Math.floor(Math.random() * 500000)
            log = Math.round(Math.random() * 600) / 100
          } else {
            copies = null
            log = null
          }

          resultData.copies = copies
          resultData.log = log
          resultData.resultText = result.resultText
            .replace('{0}', copies)
            .replace('{1}', log)

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQ-DAK-HCV-${i}-${j}`,
              assayId: assayDaktariHcvId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${(i % 2) + 1}`,
              sampleGroup: `GRP-HIV-${i % 5}`,
              resultCategory1: result.category1,
              resultData: JSON.stringify(resultData),
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 64),
              createdOn: addMinutes(randomDate, 90),
              updatedOn: addMinutes(randomDate, 115),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(patientNumber)]),
              senderVersion: '4.4',
              senderOperator: 'Aaron',
              notes: 'This is an HCV test result',
              errorCode:
                result.category1 === resultCategoryErrorId
                  ? errorCodes[_.random(errorCodes.length)]
                  : null,
              errorNotes:
                result.category1 === resultCategoryErrorId
                  ? 'Exceeded cycle threshold'
                  : null,
            })
          )

          const [lastLogId] = await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: acknowledged,
            operator: 'Aaron',
            changedOn: addMinutes(randomDate, 120),
            createdOn: addMinutes(randomDate, 120),
            createdBy: adminId,
          })
          await knex('Result')
            .where('id', resultId)
            .update({ resultWorkflowStatusLogId: lastLogId })
        }
      })
    )
  })
}
