function addSubscriptions(queue) {
  queue.subscribe(require('./deviceApi/endpoints').subscriptions)
  queue.subscribe(require('./fact/endpoints').subscriptions)
}

module.exports = { addSubscriptions }
