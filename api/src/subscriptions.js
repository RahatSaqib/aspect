function addSubscriptions(queue) {
  queue.subscribeAll(require('./deviceApi/endpoints').subscriptions)
}

module.exports = { addSubscriptions }
