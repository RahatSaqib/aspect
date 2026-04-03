const _ = require('lodash')
const Promise = require('bluebird')

const subscribers = {
  notificationType: require('./notificationType/subscriptions').subscriptions,
  logger: require('./logger/endpoints').subscriptions,
  device: require('./device/subscriptions').subscriptions,
  deviceApi: require('./deviceApi/subscriptions').subscriptions,
  deviceApiRaw: require('./deviceApiRaw/endpoints').subscriptions,
  fact: require('./fact/subscriptions').subscriptions,
  issue: require('./issue/endpoints').subscriptions,
  notification: require('./notification/endpoints').subscriptions,
  alert: require('./alert/endpoints').subscriptions,
  email: require('./email/endpoints').subscriptions,
  sms: require('./sms/endpoints').subscriptions,
  webhook: require('./webhook/endpoints').subscriptions,
  pushNotification: require('./pushNotification/endpoints').subscriptions,
  case: require('./case/endpoints').subscriptions,
  inventory: require('./inventory/subscriptions').subscriptions,
}
async function addSubscriptions(queue) {
  await Promise.each(_.keys(subscribers), async key => queue.subscribe(key, subscribers[key]))
}

module.exports = { addSubscriptions }
