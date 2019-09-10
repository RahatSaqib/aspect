const Promise = require('bluebird')
const {
  addMilliseconds,
  addMinutes,
  addHours,
  subHours,
  subDays,
  format,
} = require('date-fns')
module.exports = require('../utils').seed(
  seed,
  `${__filename}-${format(new Date(), 'yyyy-MM-dd')}`
)
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const _ = require('lodash')

const {
  allResultCategoryToId,
  allResultWorkflowStatusToId,
  allResultSourceToId,
  allSampleTypeToId,
  resultTypeToId,
  allDeviceStatusToId,
} = require('../../src/shared/dictionary')

const patientNumber = patients.length - 1
const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 365
const resultMtbNumber = 3000
const resultHivVlNumber = 3000
const resultEbolaNumber = 1000
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
    LessThan1000: resultCategoryLessThan1000,
    MoreThan1000: resultCategoryMoreThan1000,
    Indeterminate: resultCategoryIndeterminateId,
    Invalid: resultCategoryInvalidId,
    NoResult: resultCategoryNoResultId,
    Error: resultCategoryErrorId,
  } = await allResultCategoryToId()

  // Result Workflow Status
  const {
    Processed: processed,
    Validated: validated,
    Deliverable: deliverable,
    Acknowledged: acknowledged,
  } = await allResultWorkflowStatusToId()

  const partnerOne = await knex('Partner').first()
  const partnerOneId = partnerOne.id
  const siteDatas = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('s.partnerId', partnerOneId)
    .where('c.abbreviation', 'US')
    .select('s.*')
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

  const deviceTypes = await knex('DeviceType').select()
  const assays = await knex('Assay').select()
  const assayGeneXpertMtbRifId = _.find(
    assays,
    elem => elem.externalId === 'GxMtbRif'
  ).id
  const deviceTypeGeneXpertId = _.find(
    deviceTypes,
    elem => elem.externalId === 'CepheidGeneXpert'
  ).id
  // DeviceStatus
  const { approved: deviceStatusApproved } = await allDeviceStatusToId()
  const [{ DeviceCount }] = await knex('Device')
    .where('partnerId', partnerOneId)
    .whereIn('siteId', _.map(siteDatas, 'id'))
    .count('* as DeviceCount')
  if (deviceTypes.length > DeviceCount) {
    let i = 0
    await Promise.each(deviceTypes, async elem => {
      const siteData = _.sample(siteDatas)
      await knex('Device').insert(
        Object.assign({}, auditFields, {
          name: `Router at ${i} ${siteData.shortName}`,
          shortName: `r${i}`,
          deviceTypeId: elem.id,
          deviceStatusId: deviceStatusApproved,
          partnerId: siteData.partnerId,
          geographyId: siteData.geographyId,
          siteId: siteData.id,
          createdOn: new Date(+now - 3 * i * millisInHour),
          updatedOn: new Date(+now - i * millisInHour),
          lastPingOn: new Date(+now - (i * millisInHour) / 3),
          lastSeenOn: new Date(+now - (i * millisInHour) / 3),
        })
      )
      i += 1
    })
  }

  const devicesGeneXpert = await knex('Device')
    .where({ deviceTypeId: deviceTypeGeneXpertId, partnerId: partnerOneId })
    .whereIn('siteId', _.map(siteDatas, 'id'))
    .select()

  const { id: lastSampleId } = await knex('Sample')
    .orderBy('id', 'desc')
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

  // make sure we have at least one result with these status
  let ensureResultIds = [acknowledged, validated, deliverable]

  await Promise.all(
    _.map(_.range(resultMtbNumber), async i => {
      const device = devicesGeneXpert[i % devicesGeneXpert.length]
      const siteData = siteDatas.find(site => site.id === device.siteId)
      const sample = samples[i % samples.length]
      const randomDate = subDays(new Date(), _.random(5))
      const rnd = _.random(0, 100)

      const result = _.find(
        possibleResults,
        r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
      )
      const patientNumber = patients.length - 1
      resultData.resultText = result.resultText

      const resultStatus =
        ensureResultIds.shift() || _.random(1) < 0.3
          ? deliverable
          : _.random(1) < 0.5
          ? validated
          : acknowledged

      const [resultId] = await knex('Result').insert(
        Object.assign({}, auditFields, {
          externalId: `UQTB-${i + lastSampleId}-D`,
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
        resultWorkflowStatusId: resultStatus,
        operator: 'Marsha',
        changedOn: subHours(randomDate, 25),
        createdOn: subHours(randomDate, 26),
        createdBy: adminId,
      })
      await knex('Result')
        .where('id', resultId)
        .update({ resultWorkflowStatusLogId: lastLogId })
    })
  )

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
      resultText: 'Ebola GP NOT DETECTED|Ebola NP NOT DETECTED',
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
    },
    {
      resultText: 'Ebola GP DETECTED|Ebola NP NOT DETECTED',
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
  ).id
  await Promise.all(
    _.map(_.range(resultEbolaNumber), async i => {
      const device = devicesGeneXpert[i % devicesGeneXpert.length]
      const siteData = siteDatas.find(site => site.id === device.siteId)
      const sample = samples[i % samples.length]
      const randomDate = subDays(new Date(), _.random(5))
      // Result source
      const {
        DiagnosticDevice: resultSourceDiagnosticId,
      } = await allResultSourceToId()
      let j = 0

      _.map(possibleResults, async result => {
        j += 1
        if (_.random(5) === 0) {
          resultData.resultText = result.resultText
          const resultObject = Object.assign({}, auditFields, {
            externalId: `UQEB-${i + lastSampleId}-${j}-D`,
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

          const [resultId] = await knex('Result').insert(resultObject)
          const [lastLogId] = await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: processed,
            operator: 'John',
            changedOn: addHours(randomDate, 2),
            createdOn: addHours(randomDate, 1),
            createdBy: adminId,
          })
          await knex('Result')
            .where('id', resultId)
            .update({ resultWorkflowStatusLogId: lastLogId })
        }
      })
    })
  )

  // some HIV VL samples:
  samples = []
  await Promise.all(
    _.map(_.range(resultHivVlNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HIV-${i + lastSampleId}`,
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
      resultText: 'HIV-1 DETECTED {0} copies/mL (log {1})',
      category1: resultCategoryMoreThan1000,
      minLikelihood: 0,
      maxLikelihood: 40,
    },
    {
      resultText: 'HIV-1 DETECTED {0} copies/mL (log {1})',
      category1: resultCategoryLessThan1000,
      minLikelihood: 41,
      maxLikelihood: 80,
    },
    {
      resultText: 'HIV-1 NOT DETECTED',
      category1: resultCategoryNotDetectedId,
      minLikelihood: 81,
      maxLikelihood: 90,
    },
    {
      resultText: 'No Result',
      category1: resultCategoryNoResultId,
      minLikelihood: 91,
      maxLikelihood: 93,
    },
    {
      resultText: 'Error',
      category1: resultCategoryErrorId,
      minLikelihood: 94,
      maxLikelihood: 97,
    },
    {
      resultText: 'Invalid',
      category1: resultCategoryInvalidId,
      minLikelihood: 98,
      maxLikelihood: 100,
    },
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

  const assayGeneXpertHiv1VlId = _.find(
    assays,
    elem => elem.externalId === 'GxHiv1Vl'
  ).id

  // make sure we have at least one result with these status
  ensureResultIds = [acknowledged, validated, deliverable]
  _.map(_.range(resultHivVlNumber), async i => {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

    const rnd = _.random(0, 100)
    const result = _.find(
      possibleResults,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )

    let copies = 0
    let log = 0
    if (result === possibleResults[0]) {
      copies = _.random(1001, 1000000)
      log = _.round(_.random(0.1, 9.9), 2)
    } else if (result === possibleResults[1]) {
      copies = _.random(50, 1000)
      log = _.round(_.random(0.1, 9.9), 2)
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
        ? deliverable
        : _.random(1) < 0.5
        ? validated
        : acknowledged

    const resultId = await knex('Result').insert(
      Object.assign({}, auditFields, {
        externalId: `UQHIV-${i + lastSampleId}-D`,
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
  })
}
