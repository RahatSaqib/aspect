const { alertMessageSent } = require('./actions')
const dictionary = require('../shared/dictionary')
const {
  getBaseDataSource,
  mergeTemplateData,
} = require('../stringTemplate/service')

function onAlertMessageCreated({ alertMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ alertMessageSent })

  return context.transact(async knex => {
    const data = await knex('AlertMessage as m')
      .innerJoin('AlertTemplate as tmpl', 'm.alertTemplateId', 'tmpl.id')
      .innerJoin('Person as p', 'm.personId', 'p.id')
      .leftJoin('Site as s', 'm.siteId', 's.id')
      .leftJoin('Device as d', 'm.deviceId', 'd.id')
      .leftJoin('Result as r', 'm.resultId', 'r.id')
      .where({ 'm.id': alertMessageId })
      .first(
        'tmpl.message as messageTemplate',
        'm.personId',
        'm.siteId',
        'm.deviceId',
        'm.resultId',
        's.name as siteName',
        's.shortName as siteShortName',
        'p.name as personName'
      )

    // merge template with data
    const ds = getBaseDataSource(data)
    const message = mergeTemplateData(data.messageTemplate, ds)
    const messageStatusId = (await dictionary.messageStatusToId()).Sent

    await knex('AlertMessage')
      .where({ id: alertMessageId })
      .update({
        message,
        messageStatusId,
        updatedOn: new Date(),
      })

    context.alertMessageSent(alertMessageId)
  })
}

module.exports = {
  onAlertMessageCreated,
}
