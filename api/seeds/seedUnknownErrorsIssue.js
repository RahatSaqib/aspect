const _ = require('lodash')
const { addMilliseconds, addMinutes, subDays } = require('date-fns')
const { rowsAsObject } = require('./utils')
const patients = require('./development/fixtures/patients.json')

const now = new Date()
const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 30

async function seedUnknownErrorsIssue(knex, partnerName, adminName) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first()

  const { id: adminId } = await knex('User as u')
    .where({ 'u.name': adminName })
    .first('u.id')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const issueCategories = await rowsAsObject(
    knex,
    'IssueCategory',
    'externalId'
  )

  const messageSeverities = await rowsAsObject(knex, 'MessageSeverity')

  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where({
      name: 'Regional Officer',
      partnerId,
    })
    .first()

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where({
      name: 'Lab User',
      partnerId,
    })
    .first()

  // ------------------------------------------
  // Module UnknownErrors issue templates
  // ------------------------------------------
  const [moduleAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message:
          'Errors without code on Module {{issue.data.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [moduleSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          'Errors without code on Module {{issue.data.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [moduleEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{issue.data.moduleName}} Errors without code',
        body:
          'Errors without code on Module {{issue.data.moduleName}}; notify RO',
        htmlBody:
          'Errors without code on <em>{{issue.data.moduleName}}</em> notify RO',
      },
      auditFields
    )
  )

  // ------------------------------------------
  // Machine UnknownErrors issue templates
  // ------------------------------------------
  const [machineAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Errors without code across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: 'Errors without code across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: 'Errors without code across machine',
        body: 'Errors without code across machine, conduct troubleshooting',
        htmlBody: 'Errors without code across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  // ------------------------------------------
  // MessageType
  // ------------------------------------------
  const [moduleMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: moduleAlertTemplateId,
    smsTemplateId: moduleSmsTemplateId,
    emailTemplateId: moduleEmailTemplateId,
  })

  const [machineMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: machineAlertTemplateId,
    smsTemplateId: machineSmsTemplateId,
    emailTemplateId: machineEmailTemplateId,
  })

  // ------------------------------------------
  // Issuetype
  // ------------------------------------------
  const [moduleIssueTypeId] = await knex('IssueType').insert({
    name: 'Module Unknown Error',
    externalId: 'ModuleUnknownError',
    i18nKey: 'issueStatusModuleUnknownError',
    issueCategoryId: issueCategories.DeviceHealth.id,
    defaultMessageTypeId: moduleMessageTypeId,
  })
  const [machineIssueTypeId] = await knex('IssueType').insert({
    name: 'Machine Unknown Error',
    externalId: 'MachineUnknownError',
    i18nKey: 'issueStatusMachineUnknownError',
    issueCategoryId: issueCategories.DeviceHealth.id,
    defaultMessageTypeId: machineMessageTypeId,
  })

  // ------------------------------------------
  // NotificationType
  // ------------------------------------------
  await knex('NotificationType').insert([
    // Module
    Object.assign(
      {
        name: 'LU Module Unknown Error',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Unknown Error',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated Module Unknown Error',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),

    // Machine
    Object.assign(
      {
        name: 'LU Machine Unknown Error',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Unknown Error',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated Machine Unknown Error',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
  ])

  // ------------------------------------------
  // Issue Escalation Triggers
  // ------------------------------------------
  await knex('IssueEscalationTrigger').insert([
    // Module
    {
      issueTypeId: moduleIssueTypeId,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: moduleIssueTypeId,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 60 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    // Machine
    {
      issueTypeId: machineIssueTypeId,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: machineIssueTypeId,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 60 },
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])
}

async function seedSampleDataForUnknownErrorsIssue(
  knex,
  partnerName,
  adminName
) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first()

  const { id: adminId } = await knex('User')
    .where({ name: adminName })
    .first('id')

  const device = await knex('Device')
    .where({ partnerId })
    .whereNotNull('geographyId')
    .whereNotNull('siteId')
    .first()

  const { geographyId, siteId } = device

  const { latitude, longitude } = await knex('Site')
    .where({ id: device.siteId })
    .first()

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [
    assays,
    sampleTypes,
    resultCategories,
    resultSources,
    resultTypes,
    resultWorkflowStatuses,
  ] = await Promise.all([
    rowsAsObject(knex, 'Assay', 'externalId'),
    rowsAsObject(knex, 'SampleType', 'externalId'),
    rowsAsObject(knex, 'ResultCategory', 'externalId'),
    rowsAsObject(knex, 'ResultSource', 'externalId'),
    rowsAsObject(knex, 'ResultType', 'externalId'),
    rowsAsObject(knex, 'ResultWorkflowStatus', 'externalId'),
  ])

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

  // samples properties
  const samples = []
  await Promise.all(
    _.map(_.range(50), async i => {
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-TB-${i}`,
          collectedOn: calculateDateForResult(i, 50, millisInMinute),
          sampleTypeId: sampleTypes.DBS.id,
          originSiteId: siteId,
        }
      )

      sample.id = await knex('Sample').insert(sample)
      samples.push(sample)
    })
  )

  // random number of results
  const totalResults = 100 + Math.floor(Math.random() * 20 - 10)
  await Promise.all(
    _.map(_.range(totalResults), async i => {
      const sample = samples[i % samples.length]
      const randomDate = calculateDateForResult(i, totalResults, 6000)

      const result = {
        resultText: 'ERROR',
        category1: resultCategories.Error.id,
        category2: null,
        minLikelihood: 29,
        maxLikelihood: 34,
      }

      resultData.resultText = result.resultText
      await knex('Result').insert(
        Object.assign({}, auditFields, {
          externalId: `UQTB-${i}`,
          assayId: assays.GxMtbRif.id,
          partnerId,
          geographyId,
          siteId,
          deviceId: device.id,
          resultWorkflowStatusId: resultWorkflowStatuses.Ordered.id,
          longitude,
          latitude,
          resultSourceId: resultSources.DiagnosticDevice.id,
          resultTypeId: resultTypes.Patient.id,
          sampleId: sample.id,
          sampleRunNumber: `${i % 2 + 1}`,
          sampleGroup: `GRP-TB-${i % 5}`,
          resultCategory1: result.category1,
          resultCategory2: result.category2,
          resultData: JSON.stringify(resultData),
          assayVersion: '4',
          startedOn: randomDate,
          endedOn: addMinutes(randomDate, 100),
          consumableSerial: `${i}12`,
          consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
          consumableLot: `Lot ${i % 5}`,
          instrumentSerial: `S-1234-${i % 3}`,
          moduleName: 'Module A',
          moduleSerial: `M-1234-${i % 4}`,
          researchId: `R-ID-${i}`,
          patientData: JSON.stringify(patients[_.random(99)]),
          senderVersion: '4.6b',
          senderOperator: 'Marsha',
          notes: 'This is a test... result',
          errorCode: null,
          errorNotes: 'Some error without error code',
        })
      )
    })
  )
}

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

module.exports = {
  seedUnknownErrorsIssue,
  seedSampleDataForUnknownErrorsIssue,
}
