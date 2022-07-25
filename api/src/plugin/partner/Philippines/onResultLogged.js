const { resultLogged } = require('../../../result/actions')
const { resultWorkflowStatusToId } = require('../../../shared/dictionary')

async function onResultLogged({ resultId, deviceLogId, userId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ resultLogged })
  return context.transact(async knex => {
    const { deviceTypeExternalId, diseaseExternalId, currentResultWorkflowStatusExternalId } = await knex('Result as r')
      .join('Device as d', 'r.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('Assay as a', 'r.assayId', 'a.id')
      .join('AssayType as at', 'a.assayTypeId', 'at.id')
      .join('Disease as dis', 'at.diseaseId', 'dis.id')
      .leftJoin('ResultWorkflowLog as rwl', 'r.resultWorkflowStatusLogId', 'rwl.id')
      .leftJoin('ResultWorkflowStatus as rws', 'rwl.resultWorkflowStatusId', 'rws.id')
      .where('r.id', resultId)
      .first(
        'dt.externalId as deviceTypeExternalId',
        'dis.externalId as diseaseExternalId',
        'rws.externalId as currentResultWorkflowStatusExternalId'
      )
    if (diseaseExternalId !== 'tb' || !currentResultWorkflowStatusExternalId) {
      return
    }
    if (
      deviceTypeExternalId === 'CepheidGeneXpert' &&
      ['Processed', 'Error', 'Validated'].includes(currentResultWorkflowStatusExternalId)
    ) {
      /*
      When the result:
       - comes from a GeneXpert
       - is complete
       - is not yet delivered
      make it deliverable so that the patient SMS goes out only once
      */
      await updateResultToDeliverable(
        knex,
        context,
        resultId,
        deviceLogId,
        userId,
        'Automatically Deliver GeneXpert Results'
      )
    } else if (['Validated', 'Delivered', 'Acknowledged', 'Flagged'].includes(currentResultWorkflowStatusExternalId)) {
      /*
      When the result:
       - does not come from a GeneXpert (most likely, the NTRL Database)
       - was validated/signed off in the past
      make it deliverable so that any changes are sent to ITIS via the itisPushTbExam Webhook
      */
      await updateResultToDeliverable(
        knex,
        context,
        resultId,
        deviceLogId,
        userId,
        'Validated Result Updated from NTRL Database'
      )
    }
  })
}

async function updateResultToDeliverable(knex, context, resultId, deviceLogId, userId, reason) {
  const now = new Date()
  const resultWorkflowDeliverableId = await resultWorkflowStatusToId('Deliverable')
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
  return context.resultLogged(resultId, deviceLogId, userId)
}

module.exports = onResultLogged
