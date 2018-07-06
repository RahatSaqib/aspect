module.exports = require('../../src/db').seed(seed)

const { getDefaultMessageTypes } = require('../utils')
const { rowsAsObject } = require('../utils')

async function seed(knex) {
  const [issueTypes, defaultMessageTypes] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
    getDefaultMessageTypes(knex),
  ])

  // check if this seed already ran
  const issueEscalationTrigger = await knex('IssueEscalationTrigger')
    .where('issueTypeId', issueTypes.ModuleTemperatureError.id)
    .first()

  if (issueEscalationTrigger) {
    return
  }

  const { id: adminId } = await knex('User as u')
    .where({ 'u.name': 'myanmar_admin' })
    .first('u.id')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where({
      name: 'Regional Officer',
      partnerId,
    })
    .first()

  await knex('NotificationType').insert([
    Object.assign(
      {
        name: 'LU Stockout - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockout.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockout.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Stockout - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockout.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockout.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stock Expiring - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockExpiring.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Stock Expiring - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockExpiring.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      },
      auditFields
    ),
  ])

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
  ])
}
