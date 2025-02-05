module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('FormDefinition').where('externalId', 'CustomFieldsExample').del()
}
