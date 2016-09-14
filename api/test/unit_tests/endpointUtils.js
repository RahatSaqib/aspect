const callHandlerOn = function (endpoint) {
  let self = this instanceof callHandlerOn ? this : new callHandlerOn(endpoint)
  self.endpoint = endpoint
  self.with = function(requestData) {
    self.requestData = requestData
    return self
  }
  self.handleResponseWith = function (callback) {
    self.handleResponseWith = callback
    return self
  }
  self.thenCall = function (callback) {
    self.thenCall = callback
    return self
  }
  self.execute = function () {
    self.endpoint.handler(self.requestData, function (result) {
      Promise.resolve(result).then(function(responseData) {
        self.handleResponseWith(responseData)
        self.thenCall()
      }).catch(function(error){
        self.thenCall(error)
      })
    })
  }
  return self
}

module.exports = {
  callHandlerOn
}
