module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Assay').where('externalId', 'GeneXpertHcv').update('externalId', 'GxHcv')
}
