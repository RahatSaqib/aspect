function addSubscriptions(queue) {
  queue.subscribeAll(require('./deviceApi/endpoints').subscriptions)
  queue.subscribeAll(require('./fact/endpoints').subscriptions)
}

module.exports = { addSubscriptions }
