module.exports = require('../utils').seed(seed, __filename)

const range = require('lodash/range')
const random = require('lodash/random')
const { insertSites } = require('../utils')
const upsertContacts = require('../common/upsert_contacts')
const partnerData = require('./fixtures/partnerData')

const NUMBER_OF_SITES = 50

async function seed(knex) {
  const { id: countryId } = await knex('Country')
    .where('abbreviation', 'NG')
    .first()
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Partner One')
    .first()
  const geographies = await knex('Geography as g')
    .where({ countryId })
    .andWhere(knex.raw('ISNULL(lgaId) = 0'))
    .innerJoin('Lga as l', 'g.lgaId', 'l.id')
    .innerJoin('State as s', 'g.stateId', 's.id')
    .select('g.id as geographyId', 'l.name as lgaName', 's.name as stateName')

  // Insert sites
  const sites = []
  range(NUMBER_OF_SITES).forEach(num => {
    const rnd = random(0, geographies.length - 1, 0)
    const geography = geographies[rnd]
    const { stateName } = geography
    const { lgaName } = geography

    sites.push({
      externalId: `Clinic ${num}`,
      name: `Clinic ${num}`,
      shortName: `Clinic ${num}`,
      stateName,
      lgaName,
      timeZoneId: 'W. Central Africa Standard Time',
      tags: ['Clinic', 'Primary'],
    })
  })
  await insertSites(knex, partnerId, countryId, sites)

  // Update results reportable site id
  const newSites = await knex('Site').whereIn(
    'externalId',
    sites.map(s => s.externalId)
  )
  const resultsIds = await knex('Result as r')
    .innerJoin('Geography as g', 'r.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .where('c.abbreviation', 'NG')
    .pluck('r.id')
  const resultsUpdates = resultsIds.map(async resultId => {
    const { id: reportableSiteId } = newSites[random(0, NUMBER_OF_SITES - 1)]
    await knex('Result').where({ id: resultId }).update({ reportableSiteId })
  })
  await Promise.all(resultsUpdates)

  // Insert contacts for reportable sites
  const contacts = []
  range(NUMBER_OF_SITES).forEach(num => {
    const site = sites[num]

    contacts.push({
      personName: site.name,
      timezone: site.timeZoneId,
      personEmailAddress: null,
      name: `Clinic ${num}`,
      jobFunctions: ['Clinician'],
      username: site.name.toLowerCase().replace(' ', ''),
      password: '12345',
      sites: [
        {
          shortName: site.shortName,
        },
      ],
    })
  })

  // Insert admin for Nigeria
  contacts.push({
    personName: 'Admin Nigeria',
    timezone: 'W. Central Africa Standard Time',
    personEmailAddress: null,
    name: 'Admin Nigeria',
    jobFunctions: ['Admin'],
    username: 'nigeria_admin',
    password: 'test07',
  })
  await upsertContacts(
    knex,
    {
      adminUserName: partnerData.adminName,
      partnerName: partnerData.partnerName,
      partnerAbbreviation: 'NG',
    },
    contacts
  )
}
