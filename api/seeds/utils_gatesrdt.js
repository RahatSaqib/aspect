const fs = require('fs')
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

const {
  allResultCategoryToId,
  allResultWorkflowStatusToId,
  resultSourceToId,
  resultTypeToId,
} = require('../src/shared/dictionary')

const now = new Date()
const millisInMinute = 1000 * 60
const resultHivNumber = 100

const resultTimeFrameInDays = 180
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

async function createUniqueSampleIdForSite(knex, prefix, siteId) {
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
    return createUniqueSampleIdForSite(knex, prefix, siteId)
  }
  return randomId
}

async function createUniqueResultIdForDevice(
  knex,
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
      knex,
      candidateId,
      deviceId,
      (tryNumber || 0) + 1
    )
  }
  return tryNumber ? `${candidateId}-${tryNumber}` : candidateId
}

async function createSample(knex, siteId, sampleTypeId, i) {
  const externalId = await createUniqueSampleIdForSite(knex, 'PRHIVVL', siteId)
  const sample = Object.assign(
    {},
    {
      externalId,
      collectedOn: calculateDateForResult(i, resultHivNumber, millisInMinute),
      sampleTypeId,
      originSiteId: siteId,
    }
  )

  sample.id = await knex('Sample').insert(sample)

  return sample
}

// -------------------------------------------------------------------------------------
async function createResults(
  knex,
  { partnerId, deviceTypeId, assayId, patients }
) {
  const { id: userId } = await knex('User')
    .where({ name: 'gates_rdt' })
    .first('id')
  const auditFields = {
    createdOn: subMonths(now, 1),
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  // get siteId and geographyId
  const { id: siteId, geographyId } = await knex('Site')
    .where({ partnerId, externalId: 'commcare' })
    .first()
  const { id: deviceStatusId } = await knex('DeviceStatus')
    .where({ token: 'approved' })
    .first()
  // get/create device
  let { id: deviceId } =
    (await knex('Device')
      .where({
        partnerId,
        geographyId,
        siteId,
      })
      .first('id')) || {}
  if (!deviceId) {
    const lastTime = subMinutes(now, _.random(0, 60))
    ;[deviceId] = await knex('Device').insert(
      Object.assign(
        {
          partnerId,
          geographyId,
          siteId,
          deviceTypeId,
          deviceStatusId,
          name: `Commcare Sample Device`,
          shortName: `R-${_.random(100000, 999999)}`,
          serial: `S1-R-${_.random(100000, 999999)}`,
          lastSeenOn: lastTime,
          lastPingOn: lastTime,
          lastPingFromIp: '41.70.127.33',
          putInService: subMonths(now, 2),
          putInServiceSource: 'Installed at clinic',
          configurationData: '{}',
        },
        auditFields
      )
    )
  }

  const {
    Validated: validated,
    Deliverable: deliverable,
  } = await allResultWorkflowStatusToId()

  const rnd = _.random(0, 100)
  const resultSourceLimsId = await resultSourceToId('LIMS')
  const resultTypePatientId = await resultTypeToId('Patient')

  // Results and samples
  const { id: sampleTypeDBSId } = await knex('SampleType')
    .where('externalId', 'DBS')
    .select('id')

  const samples = []
  const {
    Error: resultCategoryErrorId,
    LessThan1000: resultCategoryLessThan1000Id,
    MoreThan1000: resultCategoryMoreThan1000Id,
    CollectNewSample: resultCategoryCollectNewSampleId,
  } = await allResultCategoryToId()

  const possibleResultsHiv = [
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

  _.range(resultHivNumber).map(async i => {
    const randomDate = calculateDateForResult(i, resultHivNumber, 6000)

    const sample = await createSample(knex, siteId, sampleTypeDBSId, i)
    samples.push(sample)

    const result = _.find(
      possibleResultsHiv,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )

    const patient = patients[_.random(patients.length - 1)]
    const resultData = { resultText: result.resultText }
    const resultExternalId = await createUniqueResultIdForDevice(
      knex,
      sample.externalId,
      deviceId
    )

    const resultId = await knex('Result').insert(
      Object.assign({}, auditFields, {
        externalId: resultExternalId,
        assayId,
        partnerId,
        geographyId,
        siteId,
        deviceId,
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
      createdBy: userId,
    })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: deliverable,
      changedOn: addHours(randomDate, 2),
      createdOn: addHours(randomDate, 1),
      createdBy: userId,
    })

    // for 1st result - add an attachment image
    if (i === 0) {
      const { id: fileContentTypeId } = await knex('FileContentType')
        .where({ externalId: 'imageJpg' })
        .first('id')
      // add image to table 'FileReference'
      const imageFileName = '19.jpg'
      let { id: fileReferenceId } =
        (await knex('FileReference')
          .where({
            fileContentTypeId,
            name: imageFileName,
          })
          .first('id')) || {}
      if (!fileReferenceId) {
        ;[fileReferenceId] = await knex('FileReference').insert({
          fileContentTypeId: 10,
          name: imageFileName,
        })
      }
      // bind image to result in table 'ResultFileReference'
      const resultFileReference = await knex('ResultFileReference')
        .where({
          resultId,
          fileReferenceId,
        })
        .first()
      if (!resultFileReference) {
        await knex('ResultFileReference').insert({
          resultId,
          fileReferenceId,
        })
      }
      // copy image to folder /files/##
      const filePath = `../api/files/${fileReferenceId}/${imageFileName}`
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(`../api/files/${fileReferenceId}`, { recursive: true })
        fs.copyFileSync(
          `../api/seeds/development/fixtures/${imageFileName}`,
          filePath
        )
      }
    }
  })
}

module.exports = {
  createResults,
}
