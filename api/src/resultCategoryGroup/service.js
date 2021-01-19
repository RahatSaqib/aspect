const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listResultCategoryGroupsForSelectList(request) {
  // const { auth } = request
  // const dataConstraints = await getConstraints(auth.credentials)
  const { assayId } = request.query
  // only get the device types for which the partner has at least one device
  const data = await knex('ResultCategoryGroup as rcg')
    .innerJoin('ResultCategory as rc1', 'rcg.resultCategory1Id', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'rcg.resultCategory2Id', 'rc2.id')
    .select(['rcg.externalId', 'rc1.i18nKey as resultCategory1I18nKey', 'rc2.i18nKey as resultCategory2I18nKey', 'rcg.resultCategory1Id', 'rcg.resultCategory2Id'])
    .where('rcg.assayId', assayId)

  return { ok: true, data }
}

module.exports = {
  listResultCategoryGroupsForSelectList,
}
