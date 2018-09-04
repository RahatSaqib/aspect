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
    let partnerId
    let deviceTypeId
    let fileSystemWatcherId
    if (matchingRegex) {
      fileSystemWatcherId = await fileSystemWatcherToId(matchingRegex)
      const fileSystemWatcherSettings = await knex('FileSystemWatcher as fsw')
        .leftJoin('Partner as p', 'fsw.partnerId', 'p.id')
        .leftJoin('DeviceType as dt', 'fsw.deviceTypeId', 'dt.id')
        .where('fsw.id', fileSystemWatcherId)
        .first(
          'fsw.partnerId',
          'fsw.deviceTypeId',
          'p.plugin as partnerPluginName',
          'dt.plugin as deviceTypePluginName'
        )
      ;({ partnerId, deviceTypeId } = fileSystemWatcherSettings)
      if (fileSystemWatcherSettings.partnerPluginName) {
        pluginNames.push(fileSystemWatcherSettings.partnerPluginName)
      }
      if (fileSystemWatcherSettings.deviceTypePluginName) {
        pluginNames.push(fileSystemWatcherSettings.deviceTypePluginName)
      }
    }
    const { loadPlugin } = require('../plugin/registration')
    const onNewFileDetected = await loadPlugin(pluginNames, 'onNewFileDetected')
    await onNewFileDetected(
      { filePath, partnerId, deviceTypeId, fileSystemWatcherId },
      { messageContext }
    )
  })
}

module.exports = {
  onNewFileDetected,
}
