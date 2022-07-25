module.exports = async knex => {
  // update all results that don't have an error code and are currently statused as "Ready for Delivery" despite being categorized as errors
  const [deliverableStatusId] = await knex('ResultWorkflowStatus').where({ externalId: 'Deliverable' }).pluck('id')

  const [errorStatusId] = await knex('ResultWorkflowStatus').where({ externalId: 'Error' }).pluck('id')

  const [errorCategoryId] = await knex('ResultCategory').where({ externalId: 'Error' }).pluck('id')

  await knex('Result as r')
    .join('ResultWorkflowLog as l', 'r.resultWorkflowStatusLogId', 'l.id')
    .where('l.resultWorkflowStatusId', deliverableStatusId)
    .where('r.resultCategory1', errorCategoryId)
    .whereNull('r.errorCode')
    .update('l.resultWorkflowStatusId', errorStatusId)
}
