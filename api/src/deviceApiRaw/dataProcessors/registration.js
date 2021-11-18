const Promise = require('bluebird')

const {
  PhilippinesNtrlPmdt,
  PhilippinesNtrlRitm,
} = require('./philippinesNtrlDatabases')
const registeredDataProcessors = [
  require('./abbottM2000'),
  PhilippinesNtrlPmdt,
  PhilippinesNtrlRitm,
  require('./senaiteLims'),
  require('./cobas'),
  require('./bdMgit'),
  require('./truenatDevice/authenticate'),
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
