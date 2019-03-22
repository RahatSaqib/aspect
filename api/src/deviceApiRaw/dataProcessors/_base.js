class DataProcessor {
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

  static async canProcessRequest() {
    return Promise.resolve(false)
  }

  async processRequest() {
    this.messageContext.deviceRawMessageResponseReady(this.id, this.id)
    this.messageContext.deviceRawMessageProcessed(this.id)
    return Promise.resolve()
  }
}

module.exports = DataProcessor
