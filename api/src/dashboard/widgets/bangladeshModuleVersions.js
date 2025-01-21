const { addConstraints } = require('../../auth/constraints')

function bangladeshModuleVersions(knex, constraints) {
  return knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .modify(addConstraints, constraints, {
      device: 'd',
      deviceType: 'dt',
    })
    .leftJoin(function () {
      this.distinct('r1.deviceId')
        .from('Result as r1')
        .where('r1.assayId', function () {
          this.select('a.id')
            .from('Assay as a')
            .where('a.externalId', 'GxMtbXdr')
        }).as('r')
    }, 'd.id', 'r.deviceId')
    .modify(addConstraints, constraints, {
      result: 'r1',
      assay: 'a',
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .select(knex.raw(`CONCAT(
IFNULL(SUM(CASE WHEN r.deviceId IS NOT NULL THEN d.moduleBayCapacity ELSE 0 END), 0),' 6C / ',
IFNULL(SUM(CASE WHEN r.deviceId IS NULL THEN d.moduleBayCapacity ELSE 0 END), 0),' 10C') AS cnt
`))
}

module.exports = {
  bangladeshModuleVersions
}