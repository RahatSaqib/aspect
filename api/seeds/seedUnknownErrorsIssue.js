const { rowsAsObject } = require('./utils')

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
          'Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
      },
      auditFields
    )
  )

  const [moduleSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
      },
      auditFields
    )
  )

  const [moduleEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject:
          '{{device.name}}: Errors without code on module {{issue.data.moduleName}}',
        body:
          '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
        htmlBody:
          '{{device.name}}: Errors without code on module <em>{{issue.data.moduleName}}</em>, conduct troubleshooting.',
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
        message:
          '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
      },
      auditFields
    )
  )

  const [machineEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{device.name}}: Errors without code across machine',
        body:
          '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
        htmlBody:
          '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
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
    // Module - RO View
    Object.assign(
      {
        name: 'LU Module Unknown Error - RO View',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Unknown Error - RO View',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
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
    // Machine - RO View
    Object.assign(
      {
        name: 'LU Machine Unknown Error - RO View',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Unknown Error - RO View',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
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

async function updateUnknownErrorOnModuleMessage(knex) {
  await knex('AlertTemplate')
    .where({
      message:
        'Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
    })
    .update({
      message:
        'Possible failure on module {{issue.data.moduleName}} - unknown error - contact engineer',
    })

  await knex('SmsTemplate')
    .where({
      message:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
    })
    .update({
      message:
        '{{device.name}}: Possible failure on module {{issue.data.moduleName}} - unknown error - contact engineer',
    })

  await knex('EmailTemplate')
    .where({
      subject:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}',
    })
    .update({
      body:
        '{{device.name}}: Possible failure on module {{issue.data.moduleName}} - unknown error - contact engineer',
      htmlBody:
        '{{device.name}}: Possible failure on module <em>{{issue.data.moduleName}}</em> - unknown error - contact engineer',
    })
}

module.exports = {
  seedUnknownErrorsIssue,
  updateUnknownErrorOnModuleMessage,
}
