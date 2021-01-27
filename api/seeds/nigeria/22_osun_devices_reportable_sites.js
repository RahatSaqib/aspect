module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

async function seed(knex) {
  const devicesClinics = [{
    hostId: 'State Hospital Iwo',
    defaultReportableSiteExternalId: 2604
  },
  {
    hostId: 'GH, Ede',
    defaultReportableSiteExternalId: 2609
  },
  {
    hostId: 'Baptist Hospital, Ej',
    defaultReportableSiteExternalId: 2612
  },
  {
    hostId: 'Baptist Hospital, Ej',
    defaultReportableSiteExternalId: 2612
  },
  {
    hostId: 'SH Ilesa',
    defaultReportableSiteExternalId: 2623
  },
  {
    hostId: 'STATE HOSPITAL IKIRE',
    defaultReportableSiteExternalId: 2626
  },
  {
    hostId: 'SH Asubiaro',
    defaultReportableSiteExternalId: 2627
  },
  {
    hostId: 'PHC Oke Baale Oshogo',
    defaultReportableSiteExternalId: 2630
  },
    // {
    //   hostId: 'OAUTH, Ile Ife',
    //   defaultReportableSiteId: ?????????
    // },
    // {
    //   hostId: 'SEVENTH-DAY ADVENTIS',
    //   defaultReportableSiteId: ?????????
    // },
  ]

  await Promise.each(devicesClinics, async ({ hostId, defaultReportableSiteExternalId }) => {
    const { id: defaultReportableSiteId } = (await knex('Site').where({ externalId: defaultReportableSiteExternalId }).first() || { })
    await knex('Device').where({ hostId }).update({ defaultReportableSiteId })
  })
}

