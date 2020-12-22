async function seed(knex) {
  const { id: gxHcvId } = await knex('Assay').where({ externalId: 'GxHcv' }).first()
  const { id: resultCategoryNotDetectedId } = await knex('ResultCategory').where({ externalId: 'NotDetected' }).first()

  await knex('ResultCategoryAssay').insert({
    assayId: gxHcvId,
    resultCategoryId: resultCategoryNotDetectedId
  })
}

module.exports = seed
