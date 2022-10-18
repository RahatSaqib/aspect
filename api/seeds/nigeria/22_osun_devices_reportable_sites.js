module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

async function seed(knex) {
  const devicesClinics = [
    {
      hostId: 'State Hospital Iwo',
      defaultReportableSiteExternalId: '2604',
    },
    {
      hostId: 'GH, Ede',
      defaultReportableSiteExternalId: '2609',
    },
    {
      hostId: 'Baptist Hospital, Ej',
      defaultReportableSiteExternalId: '2612',
    },
    {
      hostId: 'SH Ilesa',
      defaultReportableSiteExternalId: '2623',
    },
    {
      hostId: 'STATE HOSPITAL IKIRE',
      defaultReportableSiteExternalId: '2626',
    },
    {
      hostId: 'SH Asubiaro',
      defaultReportableSiteExternalId: '2627',
    },
    {
      hostId: 'PHC Oke Baale Oshogo',
      defaultReportableSiteExternalId: '2630',
    },
    // For the next devices we don't have a Clinic that matches the lab's name, so the lab was set as the reportable site
    {
      hostId: 'OAUTH, Ile Ife',
      defaultReportableSiteExternalId: 'OAUTH IFE',
    },
    {
      hostId: 'SEVENTH-DAY ADVENTIS',
      defaultReportableSiteExternalId: 'SDA IFE',
    },
  ]

  await Promise.each(devicesClinics, async ({ hostId, defaultReportableSiteExternalId }) => {
    const { id: defaultReportableSiteId } =
      (await knex('Site').where({ externalId: defaultReportableSiteExternalId }).first()) || {}
    if (defaultReportableSiteId) await knex('Device').where({ hostId }).update({ defaultReportableSiteId })
  })
}
