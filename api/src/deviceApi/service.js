const { resultLoggedProcessed } = require('../result/actions')
const { loadPlugin } = require('../plugin/loadPlugin')
const logger = require('../shared/logger')

async function onResultLogged(action, context) {
  return context.messageContext.run(async knex => {
    const { partnerPluginName, deviceTypePluginName } =
      (await knex('Result as r')
        .leftJoin('Partner as p', 'r.partnerId', 'p.id')
        .leftJoin('Device as d', 'r.deviceId', 'd.id')
        .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where({ 'r.id': action.resultId })
        .first('p.plugin as partnerPluginName', 'dt.plugin as deviceTypePluginName')) || {}
    logger.debug(
      [
        `onResultLogged locating the plugin function on resultId:${action.resultId} for partnerPlugin:${partnerPluginName} or devicePlugin:${deviceTypePluginName}`,
      ],
      {
        reLabel: 'deviceApi:onResultLogged',
      }
    )
    const pluginOnResultLogged = await loadPlugin(partnerPluginName, deviceTypePluginName, 'onResultLogged')
    await pluginOnResultLogged(action, context)
    context.messageContext.queue.dispatch(resultLoggedProcessed(action.resultId, action.deviceLogId), undefined, {
      expiration: 60000,
    })
  })
}

module.exports = {
  onResultLogged,
}
