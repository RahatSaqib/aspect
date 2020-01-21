module.exports = require('../utils').seed(seed, __filename)

const patientDataSchema = require('../fixtures/MGITPatientDataSchema.json')

async function seed(knex) {
  await knex('Assay')
    .update({
      patientDataSchema: JSON.stringify(patientDataSchema),
    })
    .where({ externalId: 'assayBdMgitAst' })
}
