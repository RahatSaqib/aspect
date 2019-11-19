const Promise = require('bluebird')

const registeredDataProcessors = [
  require('./abbottM2000'),
  require('./bdMgit'),
  require('./senaiteLims'),
  require('./philippinesNtrl'),
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
