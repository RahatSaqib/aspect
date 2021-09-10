const _ = require('lodash')

const subscribers = {
  logger: require('./logger/endpoints').subscriptions,
  device: require('./device/endpoints').subscriptions,
  deviceApi: require('./deviceApi/endpoints').subscriptions,
  deviceApiRaw: require('./deviceApiRaw/endpoints').subscriptions,
  fact: require('./fact/endpoints').subscriptions,
  issue: require('./issue/endpoints').subscriptions,
  notification: require('./notification/endpoints').subscriptions,
  alert: require('./alert/endpoints').subscriptions,
  email: require('./email/endpoints').subscriptions,
  sms: require('./sms/endpoints').subscriptions,
  webhook: require('./webhook/endpoints').subscriptions,
  pushNotification: require('./pushNotification/endpoints').subscriptions,
  case: require('./case/endpoints').subscriptions,
  patient: require('./patient/endpoints').subscriptions,
}
function addSubscriptions(queue) {
  _.each(_.keys(subscribers), key => queue.subscribe(key, subscribers[key]))
}

async function updateSubscription(queue, subscriptionKey) {
  if (subscribers[subscriptionKey]) {
    queue.subscribe(subscriptionKey, subscribers[subscriptionKey])
  } else throw new Error('Subscription key not defined')
}
module.exports = { addSubscriptions, updateSubscription }
