module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  // remove decimals from target data collection
  await knex('DashboardWidgetTarget').update({
    sqlForDataCollection: knex.raw(
      "replace(sqlForDataCollection, '100,2),', '100,0),')"
    ),
  })
}
