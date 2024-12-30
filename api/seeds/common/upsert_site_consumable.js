/* eslint-disable import/no-dynamic-require */
const BluebirdPromise = require('bluebird')
const { getPartnerByExternalId, getCountryByAbbreviation } = require('../utils')
const { getListSitesForSelectList } = require('../../src/site/service')
const { getConsumableTypes, getSiteConsumable } = require('../../src/consumable/common/db')

const MAX_CONCURRENT_SITES = 10

async function seedSiteConsumables(knex, partnerData) {
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

  const { getItems: consumableQuery } = await getConsumableTypes(dataConstraints, {})
  const [{ data: sites }, consumables] = await Promise.all([
    getListSitesForSelectList(dataConstraints, {}),
    consumableQuery,
  ])
  const insertPromises = sites.flatMap(({ id: siteId }) =>
    consumables.map(({ id: consumableId }) => {
      return async () => {
        const isAvailable = await getSiteConsumable({ siteId, consumableId })
        if (!isAvailable) {
          await knex('SiteConsumable').insert({ siteId, consumableId })
        }
      }
    })
  )

  await BluebirdPromise.map(insertPromises, task => task(), { concurrency: MAX_CONCURRENT_SITES })
}

module.exports = seedSiteConsumables
