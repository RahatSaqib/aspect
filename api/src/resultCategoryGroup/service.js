const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listResultCategoryGroupsForSelectList(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { assayId } = request.query

  const data = await knex('ResultCategoryGroup as rcg')
    .innerJoin('Assay as a', 'rcg.assayId', 'a.id')
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
    })
    .select(['rcg.externalId', 'rcg.name', 'rcg.i18nKey'])
    .where('rcg.assayId', assayId)

  return { ok: true, data }
}

module.exports = {
  listResultCategoryGroupsForSelectList,
}
