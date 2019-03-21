const Promise = require('bluebird')

const registeredDataProcessors = [
  require('./cepheidGeneXpert'),
  require('./alereQ'),
  require('./default'),
]

async function loadRawDataProcessor(decrypteDeviceApiRaw, messageContext) {
  let result = null
  await Promise.each(registeredDataProcessors, async dataProcessor => {
    if (!result) {
      const matched = await dataProcessor.predicate(decrypteDeviceApiRaw)
      if (matched) {
        result = dataProcessor
      }
    }
    return Promise.resolve()
  })
  return result.create(decrypteDeviceApiRaw, messageContext)
}

module.exports = {
  loadRawDataProcessor,
}
