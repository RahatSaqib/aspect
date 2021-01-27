module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

const { sites } = require('./fixtures/sites.json')
const { insertSites } = require('../utils')
const contacts = require('./fixtures/contacts.json')
const partnerData = require('./fixtures/partnerData')
const upsertContacts = require('../common/upsert_contacts')

async function seed(knex) {
  const devicesClinics = [{
    hostId: 'State Hospital Iwo',
    defaultReportableSiteId: 2604
  },
  {
    hostId: 'GH, Ede',
    defaultReportableSiteId: 2609
  },
  {
    hostId: 'Baptist Hospital, Ej',
    defaultReportableSiteId: 2612
  },
  {
    hostId: 'Baptist Hospital, Ej',
    defaultReportableSiteId: 2612
  },
  {
    hostId: 'SH Ilesa',
    defaultReportableSiteId: 2623
  },
  {
    hostId: 'STATE HOSPITAL IKIRE',
    defaultReportableSiteId: 2626
  },
  {
    hostId: 'SH Asubiaro',
    defaultReportableSiteId: 2627
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
    const { id: defaultReportableSiteId } = await knex('Site').where({ externalId: defaultReportableSiteExternalId }).first()
    await knex('Device').where({ hostId }).update({ defaultReportableSiteId })
  })
}

