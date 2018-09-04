const _ = require('lodash')
const { subMinutes } = require('date-fns')

const fileSystemWatcherSettingsCache = {
  loaded: null,
  settings: null,
}

async function onNewFileDetected({ filePath }, { messageContext }) {
  return messageContext.run(async knex => {
    const now = new Date()
    // Reload cache every 5 minutes
    if (
      !fileSystemWatcherSettingsCache.loaded ||
      fileSystemWatcherSettingsCache.loaded < subMinutes(now, 5)
    ) {
      fileSystemWatcherSettingsCache.loaded = now
      fileSystemWatcherSettingsCache.settings = await knex(
        'FileSystemWatcher as fsw'
      )
        .leftJoin('Partner as p', 'fsw.partnerId', 'p.id')
        .leftJoin('DeviceType as dt', 'fsw.deviceTypeId', 'dt.id')
        .select(
          'fsw.pathMatchRegex',
          'p.plugin as partnerPluginName',
          'dt.plugin as deviceTypePluginName'
        )
    }
    const matchingSetting =
      _.head(
        fileSystemWatcherSettingsCache.settings,
        fileSystemWatcherSetting => {
          const regExp = new RegExp(fileSystemWatcherSetting.pathMatchRegex)
          return regExp.test(filePath)
        }
      ) || {}
    const pluginNames = []
    if (matchingSetting.partnerPluginName) {
      pluginNames.push(matchingSetting.partnerPluginName)
    }
    if (matchingSetting.deviceTypePluginName) {
      pluginNames.push(matchingSetting.deviceTypePluginName)
    }
    const { loadPlugin } = require('../plugin/registration')
    const onNewFileDetected = await loadPlugin(pluginNames, 'onNewFileDetected')
    await onNewFileDetected({ filePath }, { messageContext })
  })
}

module.exports = {
  onNewFileDetected,
}
