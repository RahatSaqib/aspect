module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

async function seed(knex) {
  const { id: jobFunctionIdAdmin } = await knex('JobFunction').where('externalId', 'admin').first('id')
  const { id: jobFunctionIdSystemOne } = await knex('JobFunction').where('externalId', 'systemOne').first('id')
  const { id: jobFunctionIdDeviceMaker } = await knex('JobFunction').where('externalId', 'deviceMaker').first('id')

  // get notification types for hardware issues:
  const notificationTypes = await knex('NotificationType as nt')
    .join('IssueType as it', 'nt.issueTypeId', 'it.id')
    .where('it.externalId', 'like', 'Hardware%')
    .where('nt.jobFunctionId', jobFunctionIdAdmin)
    .select(
      'nt.id',
      'nt.issueTypeId',
      'nt.partnerId',
      'nt.name',
      'nt.level',
      'nt.canAcknowledge',
      'nt.messageTypeId',
      'nt.createdBy',
      'nt.updatedBy'
    )

  await Promise.each(notificationTypes, async nt => {
    // assign all that were assigned to admin to systemOne instead
    await knex('NotificationType').update('jobFunctionId', jobFunctionIdSystemOne).where('id', nt.id)

    // add new entry for deviceMaker
    await knex('NotificationType').insert({
      partnerId: nt.partnerId,
      issueTypeId: nt.issueTypeId,
      jobFunctionId: jobFunctionIdDeviceMaker,
      level: nt.level,
      canAcknowledge: nt.canAcknowledge,
      messageTypeId: nt.messageTypeId,
      name: nt.name,
      createdOn: new Date(),
      createdBy: nt.createdBy,
      updatedOn: new Date(),
      updatedBy: nt.updatedBy,
    })
  })
}
