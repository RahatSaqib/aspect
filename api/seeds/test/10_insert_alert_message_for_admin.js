module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const { messageStatusToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { userId } = await knex('User').where({ name: 'Admin' }).first('id as userId')

  // read 1st Result and coresponding
  const issues = await knex('Issue as i')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .select('i.id', 'i.deviceId', 'i.siteId')
    .limit(100)

  const messageStatusId = await messageStatusToId('Initial')
  await Promise.each(issues, async elem => {
    // add sample alert message
    const now = new Date(new Date().toDateString())
    const idTemplate = Math.floor(Math.random() * 9) + 1
    const [alertMessageId] = await knex('AlertMessage').insert({
      alertTemplateId: idTemplate,
      messageStatusId,
      message: `Test message ${idTemplate}`,
      personId: userId,
      siteId: elem.siteId,
      deviceId: elem.deviceId,
      createdOn: now,
      updatedOn: now,
    })
    await knex('Notification').insert({
      createdOn: now,
      alertMessageId,
      issueId: elem.id,
      personId: userId,
      notificationTypeId: 1,
    })
  })
}
