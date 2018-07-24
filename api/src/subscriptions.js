function addSubscriptions(queue) {
  queue.subscribe('deviceApi', require('./deviceApi/endpoints').subscriptions)
  queue.subscribe('fact', require('./fact/endpoints').subscriptions)
  queue.subscribe('issue', require('./issue/endpoints').subscriptions)
  queue.subscribe(
    'notification',
    require('./notification/endpoints').subscriptions
  )

  queue.subscribe('alert', require('./alert/endpoints').subscriptions)
  queue.subscribe('email', require('./email/endpoints').subscriptions)
  queue.subscribe('sms', require('./sms/endpoints').subscriptions)
  queue.subscribe('webhook', require('./webhook/endpoints').subscriptions)
}

module.exports = { addSubscriptions }
