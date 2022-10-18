module.exports = require('../utils').seed(seed, __filename)
const { resultCategoryToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  await knex('ResultCategoryAssay')
    .update({ requiresTreatment: 1 })
    .where({ resultCategoryId: await resultCategoryToId('PositiveMTB') })
}
