exports.up = async function (knex) {
  await knex.schema.alterTable('Country', country => {
    country.string('lgaName', 100).after('portNumber')
    country.string('stateName', 100).after('portNumber')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Country', country => {
    country.dropColumn('lgaName')
    country.dropColumn('stateName')
  })
}
