const Promise = require('bluebird')

class RawDataProcessor {
  constructor(
    name,
    { id, rawData, deviceApiKeySnapshot, createdOn, updatedOn },
    messageContext
  ) {
    Object.assign(this, {
      name,
      id,
      request: rawData,
      deviceApiKey: deviceApiKeySnapshot,
      createdOn,
      updatedOn,
      messageContext,
    })
    this.processRequest = this.processRequest.bind(this)
  }

  async processRequest() {
    this.messageContext.deviceRawMessageProcessed(this.id, this.id)
    return Promise.resolve()
  }
}

function createRawDataProcessor(name, deviceApiRawRecord, messageContext) {
  return new RawDataProcessor(name, deviceApiRawRecord, messageContext)
}

module.exports = {
  createRawDataProcessor,
  RawDataProcessor,
}
