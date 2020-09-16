const { resultUpdated } = require('../../../result/actions')
const { resultWorkflowStatusToId } = require('../../../shared/dictionary')

async function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ resultUpdated })
  return context.transact(async knex => {
    const { externalId: deviceTypeExternalId } = await knex('Result as r')
      .join('Device as d', 'r.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .where('r.id', resultId)
      .first('dt.externalId')
    if (deviceTypeExternalId === 'CepheidGeneXpert') {
      await updateResultToDeliverable(
        knex,
        context,
        resultId,
        'Automatically Deliver GeneXpert Results'
      )
    } else {
      const currentResultWorkflowStatusExternalId = await knex('Result as r')
        .join(
          'ResultWorkflowLog as rwl',
          'r.resultWorkflowStatusLogId',
          'rwl.id'
        )
        .join(
          'ResultWorkflowStatus as rws',
          'rwl.resultWorkflowStatusId',
          'rws.id'
        )
        .where('r.id', resultId)
        .first('rws.externalId')
      if (
        ['Validated', 'Delivered', 'Acknowledged', 'Flagged'].includes(
          currentResultWorkflowStatusExternalId
        )
      ) {
        await updateResultToDeliverable(
          knex,
          context,
          resultId,
          'Validated Result Updated from NTRL Database'
        )
      }
    }
  })
}

async function updateResultToDeliverable(knex, context, resultId, reason) {
  const now = new Date()
  const resultWorkflowDeliverableId = await resultWorkflowStatusToId(
    'Deliverable'
  )
  const [resultWorkflowLogId] = await knex('ResultWorkflowLog').insert({
    resultId,
    resultWorkflowStatusId: resultWorkflowDeliverableId,
    operator: null,
    changedOn: now,
    createdOn: now,
    reason,
  })
  await knex('Result').where('id', resultId).update({
    resultWorkflowStatusLogId: resultWorkflowLogId,
  })
  context.resultUpdated(resultId)
}

module.exports = onResultLogged
