const { addConstraints } = require('../../auth/constraints')

function disabledModules(knex, dataConstraints) {
  return knex('Issue as i2')
    .innerJoin('IssueType as it', 'i2.issueTypeId', 'it.id')
    .innerJoin('IssueStatus as is', 'i2.issueStatusId', 'is.id')
    .innerJoin('Device as d', 'i2.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      partner: 'p',
    })
    .where('it.externalId', 'ModuleDisabled')
    .andWhere('is.externalId', 'Active')
    .andWhereNot('dt.externalId', 'GxAlert')
    .first({ cnt: knex.raw('COUNT(DISTINCT i2.data->"$.moduleSerial")') })
}

module.exports = {
  disabledModules,
}
