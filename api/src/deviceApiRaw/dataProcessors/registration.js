const Promise = require('bluebird')

const {
  PhilippinesNtrlPmdt,
  PhilippinesNtrlRitm,
} = require('./philippinesNtrlDatabases')

const registeredDataProcessors = [
  require('./truenatDevice/authenticate'),
  require('./truenatDevice/result'),
  require('./abbottM2000'),
  PhilippinesNtrlPmdt,
  PhilippinesNtrlRitm,
  require('./senaiteLims'),
  require('./cobas'),
  require('./bdMgit'),
  require('./default'),
]

async function findRawDataProcessor(request, h) {
  let DataProcessorClass = null
  await Promise.each(registeredDataProcessors, async Registration => {
    if (!DataProcessorClass) {
      const canProcessRequest = await Registration.canProcessRequest(request, h)
      if (canProcessRequest) {
        DataProcessorClass = Registration
      }
    }
    return Promise.resolve()
  })
  return DataProcessorClass
}

async function loadRawDataProcessor(request, messageContext, h) {
  const DataProcessorClass = await findRawDataProcessor(request, h)
  if (DataProcessorClass) {
    return new DataProcessorClass(request, messageContext, h)
  }
  return null
}

module.exports = {
  findRawDataProcessor,
  loadRawDataProcessor,
}
