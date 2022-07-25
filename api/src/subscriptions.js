const _ = require('lodash')
const Promise = require('bluebird')

const subscribers = {
  notificationType: require('./notificationType/subscriptions').subscriptions,
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
async function addSubscriptions(queue) {
  await Promise.each(_.keys(subscribers), async key => queue.subscribe(key, subscribers[key]))
}

async function updateSubscription(queue, subscriptionKey) {
  if (subscribers[subscriptionKey]) {
    await queue.subscribe(subscriptionKey, subscribers[subscriptionKey])
  } else throw new Error('Subscription key not defined')
}
module.exports = { addSubscriptions, updateSubscription }
