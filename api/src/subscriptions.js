function addSubscriptions(queue) {
  queue.subscribe('deviceApi', require('./deviceApi/endpoints').subscriptions)
  queue.subscribe('fact', require('./fact/endpoints').subscriptions)
  queue.subscribe('issue', require('./issue/endpoints').subscriptions)
  queue.subscribe(
    'notification',
    require('./notification/endpoints').subscriptions
  )
}

module.exports = { addSubscriptions }
