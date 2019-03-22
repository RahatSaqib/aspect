const Promise = require('bluebird')

const registeredDataProcessors = [
  require('./cepheidGeneXpert'),
  require('./alereQ'),
  require('./default'),
]

async function loadRawDataProcessor(decrypteDeviceApiRaw, messageContext) {
  let DataProcessorClass = null
  await Promise.each(registeredDataProcessors, async Registration => {
    if (!DataProcessorClass) {
      const canProcessRequest = await Registration.canProcessRequest(
        decrypteDeviceApiRaw
      )
      if (canProcessRequest) {
        DataProcessorClass = Registration
      }
    }
    return Promise.resolve()
  })
  return new DataProcessorClass(decrypteDeviceApiRaw, messageContext)
}

module.exports = {
  loadRawDataProcessor,
}
