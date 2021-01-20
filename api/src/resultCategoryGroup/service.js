const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listResultCategoryGroupsForSelectList(request) {
  // const { auth } = request
  // const dataConstraints = await getConstraints(auth.credentials)
  const { assayId } = request.query
  // only get the device types for which the partner has at least one device
  const data = await knex('ResultCategoryGroup as rcg')
    .select(['rcg.externalId', 'rcg.name', 'rcg.i18nKey'])
    .where('rcg.assayId', assayId)

  return { ok: true, data }
}

module.exports = {
  listResultCategoryGroupsForSelectList,
}
