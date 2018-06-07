module.exports = require('../../src/db').seed(seed)
const { getDefaultMessageTypes } = require('../utils')

async function seed(knex) {
  const defaultMessageTypes = await getDefaultMessageTypes(knex)
  const { id: partnerId, plugin: existingPluginName } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()
  if (existingPluginName === 'myanmar') {
    return
  }

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.DeviceOffline.alertTemplateId })
    .update({
      message: 'Cannot reach network for {{numberOfDays device.lastPingOn}}',
    })
  await knex('SmsTemplate')
    .where({ id: defaultMessageTypes.DeviceOffline.smsTemplateId })
    .update({
      message:
        '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
    })
  await knex('EmailTemplate')
    .where({ id: defaultMessageTypes.DeviceOffline.emailTemplateId })
    .update({
      subject:
        '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
      body:
        '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
      htmlBody:
        '<em>{{site.name}}</em> cannot reach network for {{numberOfDays device.lastPingOn}}',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.DeviceNoResults.alertTemplateId })
    .update({
      message: 'No testing for {{numberOfDays issue.data.lastResultOn}}',
    })
  await knex('SmsTemplate')
    .where({ id: defaultMessageTypes.DeviceNoResults.smsTemplateId })
    .update({
      message:
        '{{site.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
    })
  await knex('EmailTemplate')
    .where({ id: defaultMessageTypes.DeviceNoResults.emailTemplateId })
    .update({
      subject: '{{site.name}} No Testing',
      body: '{{site.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
      htmlBody:
        '<em>{{site.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.DeviceMaintenance.alertTemplateId })
    .update({
      message: 'Under Maintenance',
    })
  await knex('SmsTemplate')
    .where({ id: defaultMessageTypes.DeviceMaintenance.smsTemplateId })
    .update({
      message: '{{site.name}} under maintenance.',
    })
  await knex('EmailTemplate')
    .where({ id: defaultMessageTypes.DeviceMaintenance.emailTemplateId })
    .update({
      subject: '{{site.name}} Maintenance',
      body: '{{site.name}} under maintenance.',
      htmlBody: '<em>{{site.name}}</em> maintenance',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.ModuleProceduralError.alertTemplateId })
    .update({
      message: 'Module {{result.moduleName}} errors, conduct troubleshooting',
    })

  // turn off email/sms temporarily
  await knex('MessageType').update({
    emailTemplateId: null,
    smsTemplateId: null,
  })

  await knex('Partner')
    .where({ id: partnerId })
    .update({ plugin: 'myanmar' })

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
