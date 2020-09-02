const { removeAndReplaceActivity } = require('../../utils')

module.exports = async function (knex) {
  await removeAndReplaceActivity(knex, 'admin', 'edit')
}
