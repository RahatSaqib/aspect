async function seed(knex) {
  await knex('Tag').insert({ title: 'PMDT', partnerId: '1' }).onConflict('title').ignore()
}

module.exports = require('../utils').seed(seed, __filename)
