const Promise = require('bluebird')

const registeredDataProcessors = [
  require('./cepheidGeneXpert'),
  require('./alereQ'),
  require('./bdMgit'),
  require('./senaiteLims'),
  require('./default'),
]

async function loadRawDataProcessor(request, messageContext) {
  let DataProcessorClass = null
  await Promise.each(registeredDataProcessors, async Registration => {
    if (!DataProcessorClass) {
      const canProcessRequest = await Registration.canProcessRequest(request)
      if (canProcessRequest) {
        DataProcessorClass = Registration
      }
    }
    return Promise.resolve()
  })
  return new DataProcessorClass(request, messageContext)
}

module.exports = {
  loadRawDataProcessor,
}
