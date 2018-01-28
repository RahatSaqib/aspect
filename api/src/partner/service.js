const { knex, filterParams, sortPageParams } = require('../db')

const SELECT_LIST_FIELDS = [
  'p.id',
  'p.name',
  'p.partnerTypeId',
  'pt.name as partnerTypeName',
]

const SELECT_SHOW_FIELDS = [
  'p.id',
  'p.name',
  'p.partnerTypeId',
  'pt.name as partnerTypeName',
]

async function listPartners(request) {
  const { query } = request

  const partnerQuery = knex('Partner as p').modify(filterParams, query, {
    name: 'p.name',
  })
  // TODO: modify addConstraints to not require site or device
  // .modify(addConstraints, dataConstraints, {Partner: 'p'})

  // get total count for paging
  const getCount = partnerQuery
    .clone()
    .count('p.id as count')
    .first()

  // get rows
  const getItems = partnerQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .innerJoin('PartnerType as pt', 'pt.id', 'p.partnerTypeId')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function showPartner(request) {
  const { params } = request

  // get item
  const [item] = await knex('Partner as p')
    .where('p.id', params.partnerId)
    .innerJoin('PartnerType as pt', 'pt.id', 'p.partnerTypeId')
    // TODO: modify addConstraints to not require site or device
    // .modify(addConstraints, dataConstraints, {Partner: 'p'})
    .select(SELECT_SHOW_FIELDS)

  const result = { ok: true, data: item }

  return result
}

module.exports = {
  listPartners,
  showPartner,
}
