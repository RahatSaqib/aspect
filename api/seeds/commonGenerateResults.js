/* eslint-disable no-unused-vars */
const _ = require('lodash')
const Promise = require('bluebird')

const treatmentStatuses = ['OnTreatment', 'AwaitingTreatment', 'NotPossible']
const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 365
const now = new Date()
const {
  addMilliseconds,
  addMinutes,
  addHours,
  addDays,
  subHours,
  subDays,
  format,
  differenceInDays,
} = require('date-fns')

const { getMGITResultFromTBPossitive } = require('./commonTB')
const {
  allResultCategoryToId,
  allResultWorkflowStatusToId,
  allResultSourceToId,
  allSampleTypeToId,
  resultTypeToId,
  allDeviceStatusToId,
  resultTreatmentStatusToId,
} = require('../src/shared/dictionary')

const { getRandomTBPatientData } = require('./commonTbresults')

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

async function createDevicesForAllMissingTypes(
  knex,
  siteDatas,
  partnerOneId,
  auditFields,
  devicesWithSameTypePerPartner = 5,
  deviceTypesToInsert // it is the array of devicetypes to insert (externalid).
  // if it's null or empty this function is going to insert all missing types.
) {
  let deviceTypes
  const existingDevicesType = await knex('Device')
    .whereIn('siteId', _.map(siteDatas, 'id'))
    .where('partnerId', partnerOneId)
    .select('Device.deviceTypeId')
    .distinct()
  if (deviceTypesToInsert && deviceTypesToInsert.length > 1) {
    deviceTypes = await knex('DeviceType as dt')
      .whereIn('dt.externalId', deviceTypesToInsert)
      .whereNotIn('dt.id', _.map(existingDevicesType, 'deviceTypeId'))
      .select()
  } else {
    deviceTypes = await knex('DeviceType as dt')
      .whereNotIn('dt.id', _.map(existingDevicesType, 'deviceTypeId'))
      .select()
  }
  const { approved: deviceStatusApproved } = await allDeviceStatusToId()

  if (deviceTypes.length > 0 && siteDatas.length > 0) {
    let i = 0
    await Promise.each(deviceTypes, async elem => {
      _.each(_.range(devicesWithSameTypePerPartner), async () => {
        const siteData = _.sample(siteDatas)
        const deviceToInsert = {
          ...auditFields,
          name: `${siteData.shortName} Router`,
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
        }
        await knex('Device').insert(deviceToInsert)

        i += 1
      })
    })
  }
}
async function generateResults(
  knex,
  adminId,
  partnerOneId,
  patients,
  errorCodes,
  countryAbbreviation = 'US',
  resultMtbNumber = 20,
  resultHivVlNumber = 20,
  resultEbolaNumber = 0
) {
  const resultsid = []
  const siteDatas = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('s.partnerId', partnerOneId)
    .where('c.abbreviation', countryAbbreviation)
    .select('s.*')
  // Result types
  const resultTypePatientId = await resultTypeToId('Patient')
  const {
    DBS: sampleTypeDBSId,
    Plasma: sampleTypePlasmaId,
  } = await allSampleTypeToId()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
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
      category1: resultCategoryNotDetectedId,
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
  const deviceTypeBDMGIT = _.find(
    deviceTypes,
    elem => elem.externalId === 'BDMGIT'
  ).id
  createDevicesForAllMissingTypes(
    knex,
    siteDatas,
    partnerOneId,
    auditFields,
    1,
    ['BDMGIT', 'CepheidGeneXpert', 'GxMtbRif']
  )

  const devicesGeneXpert = await knex('Device')
    .where({ deviceTypeId: deviceTypeGeneXpertId, partnerId: partnerOneId })
    .whereIn('siteId', _.map(siteDatas, 'id'))
    .select()
  const devicesMGIT = await knex('Device')
    .where({ deviceTypeId: deviceTypeBDMGIT, partnerId: partnerOneId })
    .whereIn('siteId', _.map(siteDatas, 'id'))
    .select()
  const { id: lastSampleId } = await knex('Sample')
    .orderBy('id', 'desc')
    .first('id')

  // some TB samples:
  let samples = []
  await Promise.all(
    _.map(_.range(resultMtbNumber), async i => {
      const siteData = _.sample(siteDatas)
      if (siteData) {
        const sample = {
          externalId: `SMP-TB-${format(new Date(), 'tt')}`,
          collectedOn: calculateDateForResult(
            i,
            resultMtbNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }

        sample.id = await knex('Sample').insert(sample)

        samples.push(sample)
      }
    })
  )
  const {
    DiagnosticDevice: resultSourceDiagnosticId,
  } = await allResultSourceToId()
  const assayBdMgit = _.filter(
    assays,
    elem =>
      elem.externalId === 'assayBdMgitAst' ||
      elem.externalId === 'assayBdMgitGnd'
  )
  // make sure we have at least one result with these status
  let ensureResultIds = [acknowledged, validated, deliverable]
  const possitiveMTBResults = []
  await Promise.each(_.range(resultMtbNumber), async i => {
    if (devicesGeneXpert.length === 0) return
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

    const resultElement = {
      ...auditFields,
      externalId: `UQTB-${i}-${format(
        new Date(new Date() * _.random(1, 8)),
        'tt'
      )}-D`,
      assayId: assayGeneXpertMtbRifId,
      partnerId: partnerOneId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      reportableSiteId: sample.originSiteId || siteData.id,
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
      patientData: JSON.stringify(
        getRandomTBPatientData(patientNumber, patients)
      ),
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
    }
    const [resultId] = await knex('Result').insert(resultElement)
    if (
      result.category1 === resultCategoryDetectedId &&
      rnd <= 80 &&
      devicesMGIT.length > 0 &&
      assayBdMgit &&
      assayBdMgit.length > 0
    ) {
      resultElement.id = resultId
      possitiveMTBResults.push(
        await getMGITResultFromTBPossitive(
          resultElement,
          assayBdMgit,
          devicesMGIT
        )
      )
    }

    resultsid.push({ id: resultId, createdOn: now })
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
  // insert 80% of mgit results when tb is possitive on mgit.
  if (possitiveMTBResults.length > 0)
    await knex('Result').insert(possitiveMTBResults)

  // some Ebola samples:
  await Promise.all(
    _.map(_.range(resultEbolaNumber / 2), async i => {
      const siteData = _.sample(siteDatas)
      const sample = {
        externalId: `SMP-EB-${format(new Date(), 'tt')}`,
        collectedOn: calculateDateForResult(
          i,
          resultEbolaNumber,
          millisInMinute
        ),
        sampleTypeId: sampleTypePlasmaId,
        originSiteId: siteData.id,
      }

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
  const patientNumber = patients.length - 1
  await Promise.each(_.range(resultEbolaNumber), async i => {
    if (devicesGeneXpert.length === 0) return
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
        const resultObject = {
          ...auditFields,
          externalId: `UQEB-${format(new Date(), 'tt')}-${j}-D`,
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
        }
        const [resultId] = await knex('Result').insert(resultObject)
        resultsid.push({ id: resultId, createdOn: now })
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

  // some HIV VL samples:
  samples = []
  await Promise.each(_.range(resultHivVlNumber / 2), async i => {
    const siteData = _.sample(siteDatas)
    const sample = {
      externalId: `SMP-HIV-${format(new Date(), 'tt')}`,
      collectedOn: calculateDateForResult(i, resultHivVlNumber, millisInMinute),
      sampleTypeId: sampleTypeDBSId,
      originSiteId: siteData.id,
    }

    sample.id = await knex('Sample').insert(sample)

    samples.push(sample)
  })

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
    if (devicesGeneXpert.length === 0) return
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
    const resultId = await knex('Result').insert({
      ...auditFields,
      externalId: `UQHIV-${i + lastSampleId}-D`,
      assayId: assayGeneXpertHiv1VlId,
      partnerId: partnerOneId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      reportableSiteId: sample.originSiteId || siteData.id,
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
    resultsid.push({
      id: resultId,
      createdOn: now,
      assayId: assayGeneXpertHiv1VlId,
      createdBy: auditFields.createdBy,
    })

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
  return resultsid
}

async function setTreatmentStatusToResults(
  knex,
  resultsToUpdate,
  treatmentStatus
) {
  const followUps = await knex('FollowUp as f')
    .join('FollowUpType as fut', 'f.followUpTypeId', 'fut.id')
    .leftOuterJoin('FollowUpAssay as fa', 'f.id', 'fa.followUpId')
    .select(
      'f.id',
      'fa.assayId',
      'f.externalId',
      'fut.externalId as followUpTypeExternalId'
    )

  await Promise.each(resultsToUpdate, async result => {
    const randomTreatmentStatusExternalId = _.sample(treatmentStatus)
    const treatment = treatmentStatus
      ? await resultTreatmentStatusToId(randomTreatmentStatusExternalId)
      : null

    const treatmentDateTime = addMinutes(result.createdOn, 90)

    const [treatmentStatusLogId] = treatment
      ? await knex('ResultTreatmentStatusLog').insert({
          resultId: result.id,
          resultTreatmentStatusId: treatment,
          changedOn: treatmentDateTime,
          createdOn: treatmentDateTime,
        })
      : [null]

    await knex('Result')
      .where('id', result.id)
      .update({
        treatmentStatusLogId,
      })

    // add a follow up treatment if on treatment
    if (
      followUps.length > 0 &&
      randomTreatmentStatusExternalId === 'OnTreatment'
    ) {
      const followUp = _.sample(
        _.filter(followUps, f => {
          return (
            f.followUpTypeExternalId === 'treatment' &&
            (f.assayId === result.assayId || !f.assayId)
          )
        })
      )

      await knex('ResultFollowUp').insert({
        resultId: result.id,
        externalId: followUp.externalId,
        followUpId: followUp.id,
        date: treatmentDateTime,
        createdOn: treatmentDateTime,
        createdBy: result.createdBy,
        updatedOn: treatmentDateTime,
        updatedBy: result.createdBy,
      })
    }

    // add random outcomes for some results (80%)
    // outcome really only makes sense if it's been a while since treatmnent
    if (
      _.random() < 0.8 &&
      differenceInDays(now, treatmentDateTime) > 7 &&
      followUps.length > 0
    ) {
      const outcome = _.sample(
        _.filter(followUps, f => {
          return (
            f.followUpTypeExternalId === 'outcome' &&
            (f.assayId === result.assayId || !f.assayId)
          )
        })
      )
      const outcomeDateTime =
        addDays(treatmentDateTime, 7) > now
          ? now
          : addDays(treatmentDateTime, 7)
      await knex('ResultFollowUp').insert({
        resultId: result.id,
        externalId: outcome.externalId,
        followUpId: outcome.id,
        date: outcomeDateTime,
        createdOn: outcomeDateTime,
        createdBy: result.createdBy,
        updatedOn: outcomeDateTime,
        updatedBy: result.createdBy,
      })
    }
  })
}
async function getTreatmentDistributionByPartner(knex, partnerId, month) {
  const conditionBuilder = (builder, partId, specificMonth) => {
    if (partnerId) builder.where('r.partnerId', partId)
    if (specificMonth)
      builder.whereRaw("DATE_FORMAT (r.createdon, '%Y-%m') = ?", specificMonth)
  }

  return knex('Result as r')
    .innerJoin('ResultCategoryAssay as rca', builder => {
      builder
        .on('r.assayId', 'rca.assayId')
        .andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin(
      'DeviceStatus as deviceStatus',
      'd.deviceStatusId',
      'deviceStatus.id'
    )
    .where('rca.requiresTreatment', true)
    .where('deviceStatus.token', 'approved')
    .modify(conditionBuilder, partnerId, month)
    .groupByRaw("DATE_FORMAT(r.createdon,'%Y-%m')")
    .select(
      knex.raw("DATE_FORMAT(r.createdon,'%Y-%m') as month"),
      knex.raw(
        'SUM(CASE WHEN rts.externalid  IS NULL THEN 1 ELSE 0 END) AS notLinked'
      ),
      knex.raw(
        "SUM(CASE WHEN rts.externalid IN ('OnTreatment','AwaitingTreatment') THEN 1 ELSE 0 END) inTreatment"
      ),
      knex.raw(
        "SUM(CASE WHEN rts.externalid IN ('NotPossible') THEN 1 ELSE 0 END) notPossible"
      ),
      knex.raw('COUNT(*) as totalQuantity')
    )
}

async function normalizeTreatmentStatusDistribution(
  knex,
  partnerId,
  currentMonth
) {
  let resultsByPartnerByMonths = await getTreatmentDistributionByPartner(
    knex,
    partnerId,
    currentMonth
  )
  // updates results to have 70~80% with some status of treatment for each month
  if (resultsByPartnerByMonths.length > 0) {
    await Promise.each(resultsByPartnerByMonths, async elem => {
      const percentageInTreatment = Math.round(
        (elem.inTreatment / Math.max(parseFloat(elem.totalQuantity), 1.0)) * 100
      )
      if (!_.inRange(percentageInTreatment, 50, 60)) {
        const resultsQuantity = Math.round(
          (_.random(50, 60) / 100.0) * elem.totalQuantity
        )
        const queryLimit = Math.abs(resultsQuantity - elem.inTreatment)
        const queryBuilder =
          percentageInTreatment < 50
            ? builder =>
                builder.whereRaw(
                  "(rts.externalId is null or rts.externalId ='NotPossible')"
                )
            : builder =>
                builder
                  .whereNotNull('rts.externalId')
                  .where('rts.externalId', '<>', knex.raw("'NotPossible'"))

        const resultsToUpdate = await getRandomResults(
          knex,
          queryBuilder,
          queryLimit,
          partnerId,
          elem.month,
          true,
          true
        )
        if (resultsToUpdate.length > 0) {
          if (percentageInTreatment < 70) {
            await setTreatmentStatusToResults(
              knex,
              resultsToUpdate,
              treatmentStatuses.slice(0, 2) // only update with some of the on treatment status.
            )
          } else {
            await setTreatmentStatusToResults(
              knex,
              resultsToUpdate,
              null // only update with some of the on treatment status.
            )
          }
        }
      }
    })
  }

  // check again the distribution
  resultsByPartnerByMonths = await getTreatmentDistributionByPartner(
    knex,
    partnerId,
    currentMonth
  )

  if (resultsByPartnerByMonths.length > 0) {
    // normalize not possible treatment status to have 10~20% of results.
    await Promise.each(resultsByPartnerByMonths, async elem => {
      const percentageNotPossible = Math.round(
        (elem.notPossible / Math.max(parseFloat(elem.totalQuantity), 1.0)) * 100
      )

      if (!_.inRange(percentageNotPossible, 10, 20)) {
        const resultsQuantity = Math.round(
          (_.random(10, 20) / 100.0) * elem.totalQuantity
        )

        const queryLimit = Math.abs(resultsQuantity - elem.notPossible)
        const queryBuilder =
          percentageNotPossible < 10
            ? builder => builder.whereNull('rts.externalId')
            : builder =>
                builder.where('rts.externalId', '=', knex.raw("'NotPossible'"))

        const resultsToUpdate = await getRandomResults(
          knex,
          queryBuilder,
          queryLimit,
          partnerId,
          elem.month,
          true,
          true
        )
        if (resultsToUpdate.length > 0) {
          if (percentageNotPossible < 10) {
            await setTreatmentStatusToResults(
              knex,
              resultsToUpdate,
              treatmentStatuses.slice(-1) // only update with some of the on treatment status.
            )
          } else {
            await setTreatmentStatusToResults(
              knex,
              resultsToUpdate,
              null // only update with some of the on treatment status.
            )
          }
        }
      }
    })
  }
}
async function normalizeTreatmentStatusDistributionByResults(knex, resultsId) {
  if (resultsId.length > 0) {
    const inTreatment = Math.floor(
      (_.random(40, 50) / 100.0) * resultsId.length
    )
    const notPossible = Math.floor(
      (_.random(10, 20) / 100.0) * resultsId.length
    )

    if (inTreatment > 0)
      await setTreatmentStatusToResults(
        knex,
        resultsId.slice(0, inTreatment),
        treatmentStatuses.slice(0, 2) // only update with some of the on treatment status.
      )

    if (notPossible > 0) {
      await setTreatmentStatusToResults(
        knex,
        resultsId.slice(inTreatment, notPossible),
        treatmentStatuses.slice(-1)
      )
    }
  }
}
async function getRandomResults(
  knex,
  queryBuilder,
  queryLimit = 10000,
  partnerId,
  month,
  onlyRequiresTreatment,
  onlyApprovedDevices
) {
  const query = knex('Result as r')
    .innerJoin('ResultCategoryAssay as rca', builder => {
      builder
        .on('r.assayId', 'rca.assayId')
        .andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin(
      'DeviceStatus as deviceStatus',
      'd.deviceStatusId',
      'deviceStatus.id'
    )
    .modify((builder, selectedMonth) => {
      if (selectedMonth)
        builder.whereRaw("DATE_FORMAT(r.createdon,'%Y-%m')= ?", selectedMonth)
    }, month)
    .modify(
      (builder, idpartner, approvedDevices, requiresTreatment) => {
        if (idpartner) builder.where('r.partnerId', idpartner)
        if (approvedDevices) builder.where('deviceStatus.token', 'approved')
        if (requiresTreatment) builder.where('rca.requiresTreatment', true)
      },
      partnerId,
      onlyApprovedDevices,
      onlyRequiresTreatment
    )
    .modify(queryBuilder)
    .select('rts.externalid as treatmentStatusExternalId', 'r.*')
    .orderByRaw('RAND()')
    .limit(queryLimit)
  return query
}

module.exports = {
  generateResults,
  getRandomResults,
  createDevicesForAllMissingTypes,
  setTreatmentStatusToResults,
  getTreatmentDistributionByPartner,
  normalizeTreatmentStatusDistribution,
  normalizeTreatmentStatusDistributionByResults,
}
