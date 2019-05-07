const _ = require('lodash')
const Boom = require('boom')
const Promise = require('bluebird')
const { asyncHandler } = require('../routes')
const { loadRawDataProcessor } = require('./dataProcessors/registration')
const { deviceApiRawStatusToId } = require('../shared/dictionary')
const { knex } = require('../db')
const { getMessageQueue } = require('../mq')
const { decrypt } = require('../shared/encryption')

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

async function continueUnprocessedRawData() {
  const lockedId = await deviceApiRawStatusToId('Locked')
  const readyId = await deviceApiRawStatusToId('Ready')
  await knex('DeviceApiRaw')
    .where('deviceApiRawStatusId', lockedId)
    .update({ deviceApiRawStatusId: readyId })
  const readyDeviceApiRawRecords = await knex('DeviceApiRaw')
    .where('deviceApiRawStatusId', readyId)
    .select()
  const queue = await getMessageQueue('aspect')
  await Promise.each(
    readyDeviceApiRawRecords,
    async readyDeviceApiRawRecord => {
      const messageContext = queue.createMessageContext('aspect_request')
      let requestText = readyDeviceApiRawRecord.rawData
      if (readyDeviceApiRawRecord.salt) {
        requestText = decrypt(requestText, readyDeviceApiRawRecord.salt)
      }
      const request = JSON.parse(requestText)
      const dataProcessor = await loadRawDataProcessor(request, messageContext)
      dataProcessor.populateFromDeviceApiRawRecord(readyDeviceApiRawRecord)
      await dataProcessor.start()
    }
  )
}

module.exports = { addDeviceRawDataHandler, continueUnprocessedRawData }
