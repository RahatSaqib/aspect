const lpaDataSchema = require('./fixtures/dataSchemas/lpaResultDataSchema.json')

module.exports = require('../utils').seed(
  async knex =>
    knex('Assay')
      .where({ externalId: 'assayLPA' })
      .update({ resultDataSchema: JSON.stringify(lpaDataSchema) }),
  __filename
)
