async function seed(knex) {
  await knex('ResultCategoryGroup')
    .where('name', 'like', '%XDR%')
    .update({ name: knex.raw("REPLACE(name, 'XDR', 'Drug Resistance')") })
}

module.exports = require('../utils').seed(seed, __filename)
