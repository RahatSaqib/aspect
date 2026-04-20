const { addConstraints } = require('../../auth/constraints')

function bangladeshModuleVersions(knex, constraints) {
  return knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .modify(addConstraints, constraints, {
      device: 'd',
      deviceType: 'dt',
    })
    .leftJoin(
      function () {
        this.distinct('r1.deviceId')
          .from('Result as r1')
          .modify(addConstraints, constraints, {
            result: 'r1',
            assay: 'a',
          })
          .where('r1.assayId', function () {
            this.select('a.id').from('Assay as a').where('a.externalId', 'GxMtbXdr')
          })
          .as('r')
      },
      'd.id',
      'r.deviceId'
    )
    .where('dt.externalId', 'CepheidGeneXpert')
    .first(
      knex.raw(`
  IFNULL(SUM(CASE WHEN r.deviceId IS NULL THEN d.moduleBayCapacity ELSE 0 END), 0) AS cnt,
  CAST(IFNULL(SUM(CASE WHEN r.deviceId IS NOT NULL THEN d.moduleBayCapacity ELSE 0 END), 0) AS CHAR) AS extra,
  '6c' AS statStatus,
  '10c' AS extraLabel
  `)
    )
}

module.exports = {
  bangladeshModuleVersions,
}
