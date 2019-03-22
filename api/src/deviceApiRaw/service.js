const _ = require('lodash')
const Boom = require('boom')
const Promise = require('bluebird')
const { asyncHandler } = require('../routes')
const { loadRawDataProcessor } = require('./dataProcessors/registration')

const addDeviceRawDataHandler = asyncHandler(async request => {
  const { plugins: { messageContext } } = request

  const dataProcessor = await loadRawDataProcessor(request, messageContext)
  await dataProcessor.saveRequestAsReady()

  const responseReady = dataProcessor.responseReadyPromise()
  const error = dataProcessor.dataProcessorErrorPromise()

  await dataProcessor.start()

  return Promise.race([responseReady, error]).catch(error => {
    if (_.get(error, 'message') === dataProcessor.timeoutMessage) {
      throw Boom.gatewayTimeout(dataProcessor.timeoutMessage, {
        deviceApiRawId: dataProcessor.id,
        timeoutMilliseconds: dataProcessor.timeoutMilliseconds,
      })
    }
    throw error
  })
})

module.exports = { addDeviceRawDataHandler }
