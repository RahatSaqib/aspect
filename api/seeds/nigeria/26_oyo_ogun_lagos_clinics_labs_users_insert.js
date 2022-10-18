module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

const { sites } = require('./fixtures/sites.json')
const { insertSites } = require('../utils')
const contacts = require('./fixtures/contacts.json')
const partnerData = require('./fixtures/partnerData')
const upsertContacts = require('../common/upsert_contacts')
const geography = require('./fixtures/geography.json')
const { upsertStatesAndLgas } = require('../common')

async function seed(knex) {
  const { id: countryId } = await knex('Country').where('name', 'Nigeria').first('id')

  await upsertStatesAndLgas(knex, countryId, geography.countries[0].states)

  const { id: partnerId } = await knex('Partner').where('name', partnerData.partnerName).first('id')

  await insertSites(knex, partnerId, countryId, sites)
  await upsertContacts(knex, partnerData, contacts)

  const devicesClinics = [
    {
      hostId: 'Ring-Road State Hosp',
      defaultReportableSiteExternalId: '2740',
    },
    {
      hostId: 'LAUTECH Teaching Hos',
      defaultReportableSiteExternalId: '2727',
    },
    {
      hostId: 'GCH Jericho Ibadan',
      defaultReportableSiteExternalId: '2717',
    },
    {
      hostId: 'SH Saki',
      defaultReportableSiteExternalId: '2742',
    },
    {
      hostId: 'St. Hosp. Oyo Lab',
      defaultReportableSiteExternalId: '2744',
    },
    {
      hostId: 'STATE HOSPITAL OYO',
      defaultReportableSiteExternalId: '2744',
    },
    {
      hostId: 'State Hospital, OYO',
      defaultReportableSiteExternalId: '2744',
    },
    {
      hostId: '2 Division Hospital',
      defaultReportableSiteExternalId: '1953',
    },
    {
      hostId: 'State Hospital Ijaye',
      defaultReportableSiteExternalId: '2649',
    },
    {
      hostId: 'State Hospital Ota',
      defaultReportableSiteExternalId: '2666',
    },
    {
      hostId: 'OOUTH Sagamu',
      defaultReportableSiteExternalId: '2700',
    },
    {
      hostId: 'Sacred Heart Hospita',
      defaultReportableSiteExternalId: '2650',
    },
    {
      hostId: 'SH Ijebu-Ode',
      defaultReportableSiteExternalId: '2690',
    },
    {
      hostId: 'SH Isara Ogun State',
      defaultReportableSiteExternalId: '2699',
    },
    {
      hostId: 'GH Owode-Egba Ogun S',
      defaultReportableSiteExternalId: '2705',
    },
    {
      hostId: 'SH, Ilaro',
      defaultReportableSiteExternalId: '2678',
    },
    {
      hostId: 'GH Idiroko Ogun Stat',
      defaultReportableSiteExternalId: '2698',
    },
    {
      hostId: 'PHC Ota, Ogun State',
      defaultReportableSiteExternalId: '2662',
    },
    {
      hostId: 'GH Ifo, Ogun State',
      defaultReportableSiteExternalId: '2682',
    },
    {
      hostId: 'LUTH Idi Araba',
      defaultReportableSiteExternalId: '322',
    },
    {
      hostId: 'Mainland Hospital, Y',
      defaultReportableSiteExternalId: '2634',
    },
    {
      hostId: 'GH, Shomolu',
      defaultReportableSiteExternalId: '1621',
    },
    {
      hostId: 'State Hospital, Ogbo',
      defaultReportableSiteExternalId: '2725',
    },
    {
      hostId: 'St. Hosp. Oyo Lab',
      defaultReportableSiteExternalId: '2744',
    },
    {
      hostId: 'STATE HOSPITAL OYO',
      defaultReportableSiteExternalId: '2744',
    },
    {
      hostId: 'State Hospital, OYO',
      defaultReportableSiteExternalId: '2744',
    },
  ]

  await Promise.each(devicesClinics, async ({ hostId, defaultReportableSiteExternalId }) => {
    const { id: defaultReportableSiteId } =
      (await knex('Site').where({ externalId: defaultReportableSiteExternalId }).first()) || {}
    if (defaultReportableSiteId) await knex('Device').where({ hostId }).update({ defaultReportableSiteId })
  })
}
