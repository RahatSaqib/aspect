module.exports = require('../utils').seed(seed, __filename)

const { rowsAsObject, seedIssueEventTriggersForPartner, seedUnknownErrorsIssue } = require('../utils')

async function seed(knex) {
  const [issueTypes] = await Promise.all([rowsAsObject(knex, 'IssueType', 'externalId')])

  // check if this seed already ran
  const issueEscalationTrigger = await knex('IssueEscalationTrigger')
    .where('issueTypeId', issueTypes.ModuleTemperatureError.id)
    .first()

  if (issueEscalationTrigger) {
    return
  }

  const { id: adminId } = await knex('User as u').where({ 'u.name': 'myanmar_admin' }).first('u.id')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { id: partnerId } = await knex('Partner').where({ name: 'Myanmar' }).first()

  // set up escalations
  await knex('IssueEscalationTrigger').insert([
    {
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 90 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineTemperatureError.id,
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
      issueTypeId: issueTypes.MachinePowerError.id,
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
      issueTypeId: issueTypes.ModuleFailureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 90 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ReagentHealthError.id,
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
      issueTypeId: issueTypes.ModuleProceduralError.id,
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
      issueTypeId: issueTypes.MachineProceduralError.id,
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

  // RO reagent health already exists, but has to be changed slightly
  // so it shows up on the RO's dashboard as soon as the LU issues is triggered
  await knex('NotificationType').update('level', 1).where('name', 'RO Reagent Health')

  await seedUnknownErrorsIssue(knex, { partnerId, auditFields })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['DeviceMaintenance', 'ModuleReplaced'],
  })
}
