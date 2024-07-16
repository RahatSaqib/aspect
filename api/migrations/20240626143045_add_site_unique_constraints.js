exports.up = function (knex) {
  return knex.schema.alterTable('Site', function () {
    //  TODO: External IDs for the Site table should be unique. However, due to duplications
    // of external IDs in production causing release issues in multiple countries,
    // we are temporarily commenting this out.
    // table.unique('externalId');
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Site', function () {
    // If the unique constraint was applied, this would drop it.
    // table.dropUnique('externalId');
  })
}
