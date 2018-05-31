module.exports = require('../../src/db').seed(seed)
const { rowsAsObject } = require('../utils')

const now = new Date()

async function seed(knex) {
  const issueTypeDeviceMaintenance = await knex('IssueType')
    .where({ externalId: 'DeviceMaintenance' })
    .first('id')
  if (issueTypeDeviceMaintenance != null) {
    return
  }

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  const { id: adminId } = await knex('User as u')
    .where({ 'u.name': 'myanmar_admin' })
    .first('u.id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [issueTypes, issueCategories, messageSeverities] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
  ])

  // change issue/notification types from "Generic" to "Procedural"
  await knex('NotificationType').update({
    name: knex.raw("replace(name, 'Generic', 'Procedural')"),
  })

  await knex('IssueType').update({
    name: knex.raw("replace(name, 'Generic', 'Procedural')"),
    i18nKey: knex.raw("replace(i18nKey, 'Generic', 'Procedural')"),
    externalId: knex.raw("replace(externalId, 'Generic', 'Procedural')"),
  })

  await knex('AlertTemplate').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('AlertMessage').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('EmailTemplate').update({
    subject: knex.raw("replace(subject, 'Generic', 'Procedural')"),
    body: knex.raw("replace(body, 'Generic', 'Procedural')"),
    htmlBody: knex.raw("replace(htmlBody, 'Generic', 'Procedural')"),
  })

  await knex('EmailMessage').update({
    subject: knex.raw("replace(subject, 'Generic', 'Procedural')"),
    body: knex.raw("replace(body, 'Generic', 'Procedural')"),
    htmlBody: knex.raw("replace(htmlBody, 'Generic', 'Procedural')"),
  })

  await knex('SmsTemplate').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('SmsMessage').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('Partner')
    .where({ id: partnerId })
    .update({
      maxDaysDeviceNoResults: 14,
      plugin: 'myanmar',
    })

  // Issue Escalation Triggers
  await knex('IssueEscalationTrigger').insert([
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 7 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './sqlScripts/Myanmar/issues/escalations/deviceNoResultsLevel3ROEscalatedNoResults.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModulePowerError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  // Add Device Maintenance issue (no notifications for Myanmar, only issue generation)
  const [deviceMaintenanceAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Device Maintenance',
      },
      auditFields
    )
  )

  const [deviceMaintenanceSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}} maintenance',
      },
      auditFields
    )
  )

  const [deviceMaintenanceEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} Maintenance',
        body: '{{site.name}} maintenance',
        htmlBody: '{{site.name}} maintenance',
      },
      auditFields
    )
  )

  const [deviceMaintenanceMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Recommendation.id,
    alertTemplateId: deviceMaintenanceAlertTemplateId,
    smsTemplateId: deviceMaintenanceSmsTemplateId,
    emailTemplateId: deviceMaintenanceEmailTemplateId,
  })

  await knex('IssueType').insert({
    name: 'Device Maintenance',
    externalId: 'DeviceMaintenance',
    i18nKey: 'issueTypeDeviceMaintenance',
    issueCategoryId: issueCategories.DeviceHealth.id,
    defaultMessageTypeId: deviceMaintenanceMessageTypeId,
  })

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where({ name: 'Lab User', partnerId })
    .first('id')

  const { id: featureIdSiteFilterDashboard } = await knex('Feature')
    .where({ module: 'siteFilterDashboard' })
    .first('id')

  await knex('JobFunctionFeature').insert({
    jobFunctionId: jobFunctionIdLabUser,
    featureId: featureIdSiteFilterDashboard,
  })

  await knex('SampleType').insert([
    {
      name: 'Sputum',
      i18nKey: 'sampleTypeSputum',
      externalId: 'Sputum',
    },
    {
      name: 'Saliva',
      i18nKey: 'sampleTypeSaliva',
      externalId: 'Saliva',
    },
    {
      name: 'Blood',
      i18nKey: 'sampleTypeBlood',
      externalId: 'Blood',
    },
    {
      name: 'CSF',
      i18nKey: 'sampleTypeCSF',
      externalId: 'CSF',
    },
    {
      name: 'Effusion',
      i18nKey: 'sampleTypeEffusion',
      externalId: 'Effusion',
    },
    {
      name: 'Pus',
      i18nKey: 'sampleTypePus',
      externalId: 'Pus',
    },
    {
      name: 'Gastric Lavage',
      i18nKey: 'sampleTypeGastricLavage',
      externalId: 'Gastric Lavage',
    },
  ])

  const geneXpertResultDataSchema = {
    resultText: {
      title: 'Result Text',
      type: 'string',
      order: 0,
    },
    testReasonShortName: {
      title: 'Test Reason',
      type: 'string',
      order: 1,
    },
    otherReasonForTest: {
      title: 'Other Reason for Test',
      type: 'string',
      order: 2,
    },
    patientTownship: {
      title: 'Patient Township',
      type: 'string',
      order: 3,
    },
    referralCenter: {
      title: 'Referral Center',
      type: 'string',
      order: 4,
    },
    otherNotes: {
      title: 'Other Notes',
      type: 'string',
      order: 5,
    },
  }

  const geneXpertResultDataSchemaTbGxEbola = {
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'Probes',
      properties: {
        probeA: {
          title: 'Probe A',
          type: 'string',
        },
        probeB: {
          title: 'Probe B',
          type: 'string',
        },
        probeC: {
          title: 'Probe C',
          type: 'string',
        },
        probeD: {
          title: 'Probe D',
          type: 'string',
        },
        probeE: {
          title: 'Probe E',
          type: 'string',
        },
        probeSpc: {
          title: 'Probe Spc',
          type: 'string',
        },
        qc1: {
          title: 'QC1',
          type: 'string',
        },
        qc2: {
          title: 'QC2',
          type: 'string',
        },
        probeACt: {
          title: 'Probe A Ct',
          type: 'number',
        },
        probeBCt: {
          title: 'Probe B Ct',
          type: 'number',
        },
        probeCCt: {
          title: 'Probe C Ct',
          type: 'number',
        },
        probeDCt: {
          title: 'Probe D Ct',
          type: 'number',
        },
        probeECt: {
          title: 'Probe E Ct',
          type: 'number',
        },
        probeSpcCt: {
          title: 'Probe Spc Ct',
          type: 'number',
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number',
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number',
        },
        probeAEndpt: {
          title: 'Probe A Endpt',
          type: 'number',
        },
        probeBEndpt: {
          title: 'Probe B Endpt',
          type: 'number',
        },
        probeCEndpt: {
          title: 'Probe C Endpt',
          type: 'number',
        },
        probeDEndpt: {
          title: 'Probe D Endpt',
          type: 'number',
        },
        probeEEndpt: {
          title: 'Probe E Endpt',
          type: 'number',
        },
        probeSpcEndpt: {
          title: 'Probe Spc Endpt',
          type: 'number',
        },
        qc1Endpt: {
          title: 'QC1 Endpt',
          type: 'number',
        },
        qc2Endpt: {
          title: 'QC2 Endpt',
          type: 'number',
        },
      },
      order: 5,
    },
  }

  const geneXpertResultDataSchemaHiv = {
    copies: {
      title: 'Copies/mL',
      type: 'number',
      list: true,
      order: 5,
    },
    log: {
      title: 'log',
      type: 'number',
      order: 6,
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'probes',
      properties: {
        gpCt: {
          title: 'GP Ct',
          type: 'number',
        },
        gpEndPt: {
          title: 'GP Endpt',
          type: 'number',
        },
        cicCt: {
          title: 'CIC Ct',
          type: 'number',
        },
        cicEndPt: {
          title: 'CIC EndPt',
          type: 'number',
        },
        sacCt: {
          title: 'SAC Ct',
          type: 'number',
        },
        sacEndPt: {
          title: 'SAC EndPt',
          type: 'number',
        },
        npCt: {
          title: 'NP Ct',
          type: 'number',
        },
        npEndPt: {
          title: 'NP EndPt',
          type: 'number',
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number',
        },
        qc1Endpt: {
          title: 'QC1 EndPt',
          type: 'number',
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number',
        },
        qc2Endpt: {
          title: 'Qc2Endpt',
          type: 'number',
        },
      },
      order: 7,
    },
  }

  const geneXpertResultDataSchemaHcv = {
    count: {
      title: 'HCV Count',
      type: 'number',
      list: true,
      order: 5,
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'probes',
      properties: {
        gpCt: {
          title: 'GP Ct',
          type: 'number',
        },
        gpEndPt: {
          title: 'GP Endpt',
          type: 'number',
        },
        cicCt: {
          title: 'CIC Ct',
          type: 'number',
        },
        cicEndPt: {
          title: 'CIC EndPt',
          type: 'number',
        },
        sacCt: {
          title: 'SAC Ct',
          type: 'number',
        },
        sacEndPt: {
          title: 'SAC EndPt',
          type: 'number',
        },
        npCt: {
          title: 'NP Ct',
          type: 'number',
        },
        npEndPt: {
          title: 'NP EndPt',
          type: 'number',
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number',
        },
        qc1Endpt: {
          title: 'QC1 EndPt',
          type: 'number',
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number',
        },
        qc2Endpt: {
          title: 'Qc2Endpt',
          type: 'number',
        },
      },
      order: 6,
    },
  }

  // define patientData object
  const geneXpertPatientDataSchema = JSON.stringify({
    id: {
      title: 'Patient ID',
      type: 'string',
      order: 0,
    },
    name: {
      title: 'Name',
      type: 'string',
      order: 1,
    },
    surname: {
      title: 'Surname',
      type: 'string',
      order: 2,
    },
    city: {
      title: 'City',
      type: 'string',
      order: 3,
    },
    phone: {
      title: 'Phone',
      type: 'string',
      order: 4,
    },
    hivStatus: {
      title: 'HIV Status',
      type: 'string',
      order: 5,
    },
    age: {
      title: 'Age (in years)',
      type: 'number',
      order: 6,
    },
    gender: {
      title: 'Gender',
      type: 'string',
      order: 7,
    },
    microscopyResult: {
      title: 'Microscopy Result',
      type: 'string',
      order: 8,
    },
    previouslyTreated: {
      title: 'Previous Treatment',
      type: 'string',
      order: 9,
    },
  })

  await knex('Assay')
    .whereIn('externalId', ['GxMtbRif', 'GxMtbRifUltra', 'GxEbola'])
    .update({
      resultDataSchema: JSON.stringify(
        Object.assign(
          {},
          geneXpertResultDataSchema,
          geneXpertResultDataSchemaTbGxEbola
        )
      ),
      patientDataSchema: geneXpertPatientDataSchema,
    })

  await knex('Assay')
    .whereIn('externalId', ['GxHiv1Vl', 'GxHiv1Qual'])
    .update({
      resultDataSchema: JSON.stringify(
        Object.assign(
          {},
          geneXpertResultDataSchema,
          geneXpertResultDataSchemaHiv
        )
      ),
      patientDataSchema: geneXpertPatientDataSchema,
    })

  await knex('Assay')
    .where('externalId', 'GeneXpertHcv')
    .update({
      resultDataSchema: JSON.stringify(
        Object.assign(
          {},
          geneXpertResultDataSchema,
          geneXpertResultDataSchemaHcv
        )
      ),
      patientDataSchema: geneXpertPatientDataSchema,
    })

  await knex('Assay')
    .where('externalId', 'GxUnknown')
    .update({
      resultDataSchema: JSON.stringify(geneXpertResultDataSchema),
      patientDataSchema: geneXpertPatientDataSchema,
    })
}
