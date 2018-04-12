function addSubscriptions(queue) {
  queue.subscribe(require('./deviceApi/endpoints').subscriptions)
  queue.subscribe(require('./fact/endpoints').subscriptions)
  // queue.subscribe(require('./issue/endpoints').subscriptions)
  // queue.subscribe(require('./notification/endpoints').subscriptions)
}

module.exports = { addSubscriptions }
