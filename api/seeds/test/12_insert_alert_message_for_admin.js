module.exports = require('../utils').seed(seed)

const { messageStatusToId } = require('../../src/shared/dictionary')
const Promise = require('bluebird')

async function seed(knex) {
  const { userId } = await knex('User')
    .where({ name: 'Admin' })
    .first('id as userId')

  // read 1st Result and coresponding siteId/deviceId
  const results = await knex('Issue as i')
    .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .select('i.id', 'i.deviceId', 'i.siteId')
    .limit(100)

  const messageStatusId = await messageStatusToId('Initial')
  await Promise.each(results, async elem => {
    // add sample alert message
    const now = new Date(new Date().toDateString())
    const idTemplate = Math.floor(Math.random() * 9) + 1
    const insertedid = await knex('AlertMessage')
      .returning('id')
      .insert({
        alertTemplateId: idTemplate,
        messageStatusId,
        message: `Test message ${idTemplate}`,
        personId: userId,
        siteId: elem.siteId,
        deviceId: elem.deviceId,
        createdOn: now,
        updatedOn: now,
      })
    await knex('Notification').insert(
      Object.assign({
        createdOn: now,
        alertMessageId: insertedid,

        issueId: elem.id,
        personId: userId,
        notificationTypeId: 1,
      })
    )

    //    messageId.push(this.insertedid[0])
  })
}
