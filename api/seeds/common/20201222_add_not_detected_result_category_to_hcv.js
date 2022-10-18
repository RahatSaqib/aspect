async function seed(knex) {
  const { id: gxHcvId } = await knex('Assay').where({ externalId: 'GxHcv' }).first()
  const { id: resultCategoryNotDetectedId } = await knex('ResultCategory').where({ externalId: 'NotDetected' }).first()

  const item = {
    assayId: gxHcvId,
    resultCategoryId: resultCategoryNotDetectedId,
  }
  const currentResultCategoryAssay = await knex('ResultCategoryAssay').where(item).first()
  if (!currentResultCategoryAssay) await knex('ResultCategoryAssay').insert(item)
}

module.exports = seed
