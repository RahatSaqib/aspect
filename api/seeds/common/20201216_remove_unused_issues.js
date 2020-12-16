const Promise = require('bluebird')
const _ = require('lodash')

const { getBaseIssues } = require('../relatedObjects/issues')

module.exports = async function cleanIssueTypes(knex, partnerName) {
  const { userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': partnerName })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypes = await knex('IssueType').select()
  await Promise.each(issueTypes, async issueType => {
    if (
      !_.includes(Object.keys(getBaseIssues(auditFields)), issueType.externalId)
    ) {
      await knex('Issue').where({ issueTypeId: issueType.id }).delete()
      // await knex('Notification').where({ issueTypeId: issueType.id }).delete()
      await knex('IssueType').where({ id: issueType.id }).delete()
    }
  })
}
