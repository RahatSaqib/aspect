const _ = require('lodash')

const {
  allFileSystemWatcherToId,
  fileSystemWatcherToId,
} = require('../shared/dictionary')

async function onNewFileDetected({ filePath }, { messageContext }) {
  return messageContext.run(async knex => {
    const fileSystemWatcherRegexes = await allFileSystemWatcherToId()
    const matchingRegex = _.head(
      Object.keys(fileSystemWatcherRegexes),
      fileSystemWatcherRegex => {
        const regExp = new RegExp(fileSystemWatcherRegex)
        return regExp.test(filePath)
      }
    )
    const pluginNames = []
    if (matchingRegex) {
      const fileSystemWatcherId = await fileSystemWatcherToId(matchingRegex)
      const fileSystemWatcherPlugins = await knex('FileSystemWatcher as fsw')
        .leftJoin('Partner as p', 'fsw.partnerId', 'p.id')
        .leftJoin('DeviceType as dt', 'fsw.deviceTypeId', 'dt.id')
        .where('fsw.id', fileSystemWatcherId)
        .first(
          'p.plugin as partnerPluginName',
          'dt.plugin as deviceTypePluginName'
        )
      if (fileSystemWatcherPlugins.partnerPluginName) {
        pluginNames.push(fileSystemWatcherPlugins.partnerPluginName)
      }
      if (fileSystemWatcherPlugins.deviceTypePluginName) {
        pluginNames.push(fileSystemWatcherPlugins.deviceTypePluginName)
      }
    }
    const { loadPlugin } = require('../plugin/registration')
    const onNewFileDetected = await loadPlugin(pluginNames, 'onNewFileDetected')
    await onNewFileDetected({ filePath }, { messageContext })
  })
}

module.exports = {
  onNewFileDetected,
}
