const { knex, filterParams } = require('../db')

async function listPartnersForSelectList(request) {
  const { query } = request

  const partnerQuery = knex('Partner as p')
    .leftJoin('PartnerType as pt', 'p.partnerTypeId', 'pt.id')
    .modify(filterParams, query, {
      partnerType: 'pt.externalId',
    })

  // get total count for paging
  const getCount = partnerQuery.clone().count('p.id as count').first()

  // get rows
  const getItems = partnerQuery
    .clone()
    .select('p.id', 'p.name', 'p.partnerTypeId', 'pt.externalId as partnerTypeExternalId', 'pt.name as partnerTypeName')

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

module.exports = {
  listPartnersForSelectList,
}
