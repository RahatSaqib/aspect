const { knex } = require('../db')
const { addConstraints } = require('../auth/constraints')

/**
 * Shared across both FormData use cases (listFormDataEntries / showFormDataEntry):
 * the access-controlled base query. Use-case-specific filters, selection and paging
 * live in their respective use-case files.
 */
function buildBaseQuery(dataConstraints) {
  return knex('FormData as fd')
    .join('Site as s', 's.id', 'fd.siteId')
    .leftJoin('Result as r', 'r.id', 'fd.resultId')
    .modify(addConstraints, dataConstraints, { site: 's' })
}

module.exports = { buildBaseQuery }
