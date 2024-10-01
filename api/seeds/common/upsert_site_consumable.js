/* eslint-disable import/no-dynamic-require */
const { getPartnerByExternalId, getCountryByAbbreviation } = require('../utils')
const { getListSitesForSelectList } = require('../../src/site/service')
const { getConsumableTypes, getSiteConsumable } = require('../../src/consumable/common/db')

const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

async function seedSiteConsumables(knex) {
  const {
    partner: { externalId },
    partnerAbbreviation,
  } = partnerData

  const { id: partnerId } = await getPartnerByExternalId(knex, externalId)
  const { id: countryId } = await getCountryByAbbreviation(knex, partnerAbbreviation)

  const dataConstraints = {
    partner: {
      id: partnerId,
    },
    country: {
      id: countryId,
    },
  }

  const { getItems: consumableQuery } = getConsumableTypes(dataConstraints, {})

  const [{ data: sites }, consumables] = await Promise.all([
    getListSitesForSelectList(dataConstraints, {}),
    consumableQuery,
  ])

  const insertPromises = sites.flatMap(({ id: siteId }) =>
    consumables.map(async ({ id: consumableId }) => {
      const isAvailable = await getSiteConsumable({ siteId, consumableId })
      if (!isAvailable) {
        return knex('SiteConsumable').insert({ siteId, consumableId })
      }
    })
  )

  await Promise.all(insertPromises)
}

module.exports = seedSiteConsumables
