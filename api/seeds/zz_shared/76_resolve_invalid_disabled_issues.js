module.exports = require('../utils').seed(async knex => {
  await knex('Issue as i')
    .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .innerJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .leftJoin('Result as r', function () {
      this.on('r.moduleSerial', knex.raw(`i.data->>'$.moduleSerial'`)).on('r.deviceId', 'i.deviceId')
    })
    .where('it.externalId', 'ModuleDisabled')
    .andWhere('is.externalId', 'Active')
    .andWhere('r.id', null)
    .update({
      issueStatusId: knex('IssueStatus').where('externalId', 'Resolved').first('id'),
    })
}, __filename)
