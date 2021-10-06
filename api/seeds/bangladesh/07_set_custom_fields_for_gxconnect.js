const { updateCustomFields } = require('../utils')
const { partnerName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  /**
   * Notice that in func `runSeed` in file `../utils.js` we silently run func
   * `addForms` from `../relativeObjectsSeeds.js`
   * That func created `FormDefinition` records for
   * - formTypeId = 1 (Gx Connect Form)
   * - diseaseId = 1 (Tuberculosis)
   * - assayId = NULL (for all assayId's for above diseaseId)
   * So, here for Bangladesh in calling func `updateCustomFields` we remove some records from FormDefinition
   * and update another record with new jsonSchema file in table `FileDefinitionSchema`.
   */
  await updateCustomFields(
    knex,
    partnerId,
    'CustomFieldsTB_Bangladesh.json',
    'CustomFieldsTB',
    ['CustomFieldsExample']
  )
}

module.exports = require('../utils').seed(seed, __filename)
