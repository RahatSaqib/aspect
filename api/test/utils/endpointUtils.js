function callHandlerOn(endpoint) {
  return new CallHandlerOn(endpoint)
}

class CallHandlerOn {
  constructor(endpoint) {
    this.endpoint = endpoint
  }

  with(requestData) {
    this.requestData = requestData
    return this
  }

  handleResponseWith(callback) {
    this.handleResponseWithCallback = callback
    return this
  }

  thenCall(callback) {
    this.thenCallback = callback
    return this
  }

  execute() {
    this.endpoint.handler(this.requestData, (result) => {
      Promise.resolve(result).then((responseData) => {
        this.handleResponseWithCallback(responseData)
        this.thenCallback()
      }).catch((error) => {
        this.thenCallback(error)
      })
    })
    return this
  }
}

module.exports = {
  callHandlerOn
}
